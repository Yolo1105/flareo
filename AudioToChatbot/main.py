import os
import re
import time
import json
import random
import pickle
import logging
import subprocess
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from tqdm import tqdm
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import trafilatura
import pandas as pd
import numpy as np
import faiss
import pyttsx3

from sentence_transformers import SentenceTransformer

# 新增依赖，用于语音录制及转录
import sounddevice as sd
import whisper

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

#####################################
# 1. 网页抓取及数据处理模块
#####################################

class WebScraper:
    def __init__(self, base_url, output_folder, url_file='scraped_urls.json'):
        self.base_url = base_url
        self.output_folder = output_folder
        self.visited_urls = set()
        self.url_file = url_file
        self.scraped_urls = self.load_scraped_urls()
        self.driver = None

        self.headers = {
            'User-Agent': ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                           'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        }
        self.session = requests.Session()

    def load_scraped_urls(self):
        try:
            with open(self.url_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

    def save_scraped_urls(self):
        with open(self.url_file, 'w', encoding='utf-8') as f:
            json.dump(self.scraped_urls, f, indent=2, ensure_ascii=False)

    def get_page_content(self, url):
        time.sleep(random.uniform(2, 5))
        try:
            response = self.session.get(url, headers=self.headers)
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            logger.warning(f"Error fetching {url} with requests: {str(e)}. Trying Selenium.")
            return self.get_page_content_selenium(url)

    def get_page_content_selenium(self, url):
        if not self.driver:
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument(f"user-agent={self.headers['User-Agent']}")
            self.driver = webdriver.Chrome(options=chrome_options)
        try:
            self.driver.get(url)
            WebDriverWait(self.driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            return self.driver.page_source
        except Exception as e:
            logger.error(f"Selenium error for {url}: {str(e)}")
            return None

    def save_page(self, url, content):
        parsed_url = urlparse(url)
        safe_path = re.sub(r'[<>:"/\\|?*]', '_', parsed_url.path.strip('/'))
        folder = os.path.join(self.output_folder, parsed_url.netloc)
        os.makedirs(folder, exist_ok=True)
        file_path = os.path.join(folder, safe_path if safe_path else "index")
        with open(f"{file_path}.html", 'w', encoding='utf-8') as f:
            f.write(content)

    def scrape_page(self, url):
        current_time = datetime.now().isoformat()
        if url in self.scraped_urls:
            logger.info(f"Already scraped: {url}")
            return []
        self.visited_urls.add(url)
        logger.info(f"Scraping: {url}")
        content = self.get_page_content(url)
        if not content:
            logger.error(f"Failed to fetch content for {url}")
            return []
        self.save_page(url, content)
        self.scraped_urls[url] = current_time
        self.save_scraped_urls()
        soup = BeautifulSoup(content, 'html.parser')
        links = soup.find_all('a', href=True)
        new_urls = []
        for link in links:
            new_url = urljoin(self.base_url, link['href'])
            if new_url.startswith(self.base_url) and new_url not in self.visited_urls:
                new_urls.append(new_url)
        time.sleep(random.uniform(1, 3))
        return new_urls

    def scrape(self):
        urls_to_scrape = [self.base_url]
        with ThreadPoolExecutor(max_workers=5) as executor:
            while urls_to_scrape:
                new_urls_lists = list(executor.map(self.scrape_page, urls_to_scrape))
                urls_to_scrape = [url for sublist in new_urls_lists for url in sublist if url not in self.scraped_urls]
        if self.driver:
            self.driver.quit()

class DataCleaner:
    def __init__(self, input_folder, output_file):
        self.input_folder = input_folder
        self.output_file = output_file

    @staticmethod
    def extract_main_content(html_content):
        extracted = trafilatura.extract(html_content, include_links=False, include_images=False, include_tables=False)
        if extracted:
            cleaned = re.sub(r'\s+', ' ', extracted).strip()
            cleaned = re.sub(r'\n+', '\n', cleaned)
            return cleaned
        return None

    def clean_data(self):
        data = []
        for root, dirs, files in os.walk(self.input_folder):
            for file in tqdm(files, desc="Cleaning data"):
                if file.endswith('.html'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        main_content = self.extract_main_content(content)
                        if main_content:
                            data.append({
                                'file': file_path,
                                'content': main_content
                            })
                        else:
                            logger.warning(f"No main content extracted from {file_path}")
                    except Exception as e:
                        logger.error(f"Error processing {file_path}: {str(e)}")
        df = pd.DataFrame(data)
        df.to_csv(self.output_file, index=False, encoding='utf-8')
        logger.info(f"Cleaned data saved to {self.output_file}")

class RAGPreparator:
    def __init__(self, cleaned_data_file, output_file, chunk_size=1000):
        self.cleaned_data_file = cleaned_data_file
        self.output_file = output_file
        self.chunk_size = chunk_size

    def prepare_for_rag(self):
        df = pd.read_csv(self.cleaned_data_file, encoding='utf-8')
        rag_data = []
        for idx, row in df.iterrows():
            content = row['content']
            chunks = []
            current_chunk = ""
            sentences = re.split(r'(?<=[.!?])\s+', content)
            for sentence in sentences:
                if len(current_chunk) + len(sentence) > self.chunk_size and current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = sentence
                else:
                    current_chunk += " " + sentence
            if current_chunk:
                chunks.append(current_chunk.strip())
            for chunk_num, chunk in enumerate(chunks):
                rag_data.append({
                    'file': row['file'],
                    'chunk_id': chunk_num,
                    'chunk': chunk
                })
        rag_df = pd.DataFrame(rag_data)
        rag_df.to_csv(self.output_file, index=False, encoding='utf-8')
        logger.info(f"RAG-prepared data saved to {self.output_file}")

###########################################
# 2. 向量化及检索（使用 FAISS 实现）
###########################################

class FaissEmbedder:
    # def __init__(self, rag_data_file, index_file="faiss_index.pkl"):
    #     self.rag_data_file = rag_data_file
    #     self.index_file = index_file
    #     self.model = SentenceTransformer("jinaai/jina-embeddings-v3", trust_remote_code=True)
    #     self.dimension = self.model.get_sentence_embedding_dimension()
     

    def __init__(self, rag_data_file, index_file="faiss_index.pkl"):
        self.rag_data_file = rag_data_file
        self.index_file = index_file
        # 显式指定 device="cpu"，避免使用 MPS 后端
        self.model = SentenceTransformer(
            "jinaai/jina-embeddings-v3",
            trust_remote_code=True,
            device="cpu"
        )
        self.dimension = self.model.get_sentence_embedding_dimension()

    def create_index(self):
        index = faiss.IndexFlatL2(self.dimension)
        return index

    def embed_and_insert(self):
        df = pd.read_csv(self.rag_data_file, encoding='utf-8')
        index = self.create_index()
        metadata = []
        for _, row in tqdm(df.iterrows(), total=len(df), desc="Embedding and inserting"):
            embedding = self.model.encode(row['chunk'])
            index.add(np.array([embedding]).astype('float32'))
            metadata.append({
                'file': row['file'],
                'chunk_id': row['chunk_id'],
                'chunk': row['chunk']
            })
        with open(self.index_file, 'wb') as f:
            pickle.dump({'index': index, 'metadata': metadata}, f)
        logger.info(f"Inserted {index.ntotal} entities into FAISS index")

    def search(self, query, k=5):
        with open(self.index_file, 'rb') as f:
            data = pickle.load(f)
            index = data['index']
            metadata = data['metadata']
        query_vector = self.model.encode(query)
        distances, indices = index.search(np.array([query_vector]).astype('float32'), k)
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(metadata):
                results.append({
                    'distance': distances[0][i],
                    'metadata': metadata[idx]
                })
        return results

#############################################
# 3. Chatbot 及交互功能：整合检索、LLM 调用、语音输入与播报
#############################################

def query_ollama(prompt):
    """
    调用本地 Ollama 模型 llama3.2-3b，
    假设命令行为：
        ollama run llama3.2-3b --prompt "你的 prompt"
    请根据实际情况调整命令参数
    """
    try:
        cmd = ["ollama", "run", "llama3.2-3b", "--prompt", prompt]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        logger.error(f"Ollama 调用出错: {e}")
        return "抱歉，无法生成回答。"

def speak(text):
    """
    使用 pyttsx3 播报文字（离线 TTS）
    """
    engine = pyttsx3.init()
    engine.say(text)
    engine.runAndWait()

def get_voice_input(duration=5, fs=16000):
    """
    使用 sounddevice 录制音频，并调用 whisper 模型进行转录。
    这里模拟实时语音输入，录制时长可根据需要调整。
    """
    print("请开始说话……")
    recording = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype='float32')
    sd.wait()  # 等待录音结束
    audio = np.squeeze(recording)
    # 加载 whisper 模型，可选择 "base", "small", "medium", "large" 等（CPU 建议选择较小模型）
    model = whisper.load_model("base")
    # 转录音频，指定中文语言，并关闭 fp16（以适应 CPU 推理）
    result = model.transcribe(audio, language='zh', fp16=False)
    text = result["text"].strip()
    print(f"识别结果: {text}")
    return text

class RAGChatbot:
    def __init__(self, embedder: FaissEmbedder, k=3):
        self.embedder = embedder
        self.k = k

    def answer_question(self, question: str):
        # 检索相关文档片段
        results = self.embedder.search(question, k=self.k)
        context = ""
        for res in results:
            context += res['metadata']['chunk'] + "\n"
        # 构造 prompt，注意可根据需要调整模板
        prompt = f"请根据下面的上下文信息回答问题。\n上下文：\n{context}\n问题：{question}\n回答："
        logger.info(f"最终 prompt:\n{prompt}")
        answer = query_ollama(prompt)
        return answer

#########################################
# 4. 主流程：抓取、处理、索引、交互
#########################################

def main():
    # 允许用户输入待抓取的网站（多个以逗号分隔）
    websites_input = input("请输入要抓取的网站（多个用逗号分隔）：").strip()
    website_list = [url.strip() for url in websites_input.split(",") if url.strip()]
    if not website_list:
        logger.error("没有输入任何网站。退出。")
        return

    # 询问是否需要重新抓取数据（否则使用已有数据）
    do_scrape = input("是否重新抓取数据？(y/n)：").strip().lower() == "y"

    # 对于每个网站，建立一个独立的抓取目录
    for website in website_list:
        domain = urlparse(website).netloc.replace(".", "_")
        output_folder = os.path.join("scraped_data", domain)
        os.makedirs(output_folder, exist_ok=True)
        url_file = os.path.join(output_folder, f"{domain}_scraped_urls.json")
        if do_scrape:
            scraper = WebScraper(website, output_folder, url_file=url_file)
            scraper.scrape()
        else:
            logger.info(f"跳过抓取 {website}，使用已有数据。")

    # 合并所有网站的抓取数据（假设数据均存放于 scraped_data 目录下）
    merged_cleaned_csv = "merged_cleaned_data.csv"
    all_data = []
    for root, dirs, files in os.walk("scraped_data"):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        html = f.read()
                    content = DataCleaner.extract_main_content(html)
                    if content:
                        all_data.append({'file': file_path, 'content': content})
                except Exception as e:
                    logger.error(f"Error cleaning {file_path}: {e}")
    if not all_data:
        logger.error("没有抓取到有效数据。退出。")
        return
    df_all = pd.DataFrame(all_data)
    df_all.to_csv(merged_cleaned_csv, index=False, encoding='utf-8')
    logger.info(f"合并清洗后的数据保存到 {merged_cleaned_csv}")

    # RAG 数据准备
    rag_output_csv = "rag_prepared_data.csv"
    preparator = RAGPreparator(merged_cleaned_csv, rag_output_csv, chunk_size=1000)
    preparator.prepare_for_rag()

    # 向量化并建立 FAISS 索引
    embedder = FaissEmbedder(rag_output_csv, index_file="faiss_index.pkl")
    embedder.embed_and_insert()

    # 建立 RAG Chatbot
    chatbot = RAGChatbot(embedder, k=3)

    # 进入交互模式（这里采用语音输入，如需实时，可进一步优化）
    print("进入聊天模式。说 'exit' 或 'quit' 退出。")
    while True:
        # 调用基于 whisper 的语音输入
        user_input = get_voice_input()
        if user_input.lower() in ["exit", "quit"]:
            print("退出聊天。")
            break
        # 简单判断是否为问句（含问号认为是问题）
        if "?" in user_input or user_input.strip().endswith("？"):
            answer = chatbot.answer_question(user_input)
            print("Chatbot 回答：", answer)
            speak(answer)
        else:
            print("请提出一个具体的问题。")

if __name__ == "__main__":
    main()
