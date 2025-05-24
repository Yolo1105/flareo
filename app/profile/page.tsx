"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { type User } from '@/types/user';

export default function UserProfile() {
  return (
    <main
      className="container"
      style={{
        paddingTop: "var(--spacing-6)",
        paddingBottom: "var(--spacing-6)",
      }}
    >
      {/* 个人资料头部 */}
      <section className="profile-header">
        <Image
          src="https://randomuser.me/api/portraits/men/32.jpg"
          alt="用户头像"
          className="profile-avatar"
          width={120}
          height={120}
        />

        <div className="profile-info">
          <h1 className="profile-name">张小明</h1>
          <div className="profile-username">@xiaoming</div>
          <p className="profile-bio">
            全栈开发者，专注于云原生和微服务架构。热爱开源，喜欢分享技术经验和解决方案。
          </p>

          <div className="profile-meta">
            <div className="profile-meta-item">
              <i className="ri-map-pin-line profile-meta-icon" />
              北京，中国
            </div>
            <div className="profile-meta-item">
              <i className="ri-link profile-meta-icon" />
              <Link href="https://github.com/xiaoming" target="_blank">
                github.com/xiaoming
              </Link>
            </div>
            <div className="profile-meta-item">
              <i className="ri-calendar-line profile-meta-icon" />
              2023 年 3 月加入
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-outline">
              <i className="ri-edit-line" />
              编辑资料
            </button>
            <button className="btn btn-outline">
              <i className="ri-settings-3-line" />
              设置
            </button>
          </div>
        </div>

        <div className="profile-stats">
          {[
            { label: "插件", value: 12 },
            { label: "部署", value: "1.5k" },
            { label: "评分", value: 4.8 },
            { label: "等级", value: "Lv.3" },
          ].map((s) => (
            <div key={s.label} className="profile-stat">
              <div className="profile-stat-value">{s.value}</div>
              <div className="profile-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 角色切换 */}
      <div className="role-switch">
        <div className="role-option active">
          <i className="ri-code-s-slash-line" />
          开发者视图
        </div>
        <div className="role-option">
          <i className="ri-user-line" />
          使用者视图
        </div>
      </div>

      {/* 我的插件模块 */}
      <section className="module">
        <header className="module-header">
          <h2 className="module-title">
            <i
              className="ri-apps-line"
              style={{
                color: "var(--primary-color)",
                marginRight: "var(--spacing-2)",
              }}
            />
            我的插件
          </h2>
          <Link href="#" className="module-action">
            查看全部
          </Link>
        </header>

        <div className="module-body">
          <ul className="explore-list">
            {[
              {
                id: 1,
                title: "API 网关",
                img: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=2850&q=80",
                installs: "3.5k",
                rating: 4.8,
                price: "免费",
              },
              {
                id: 2,
                title: "日志分析器",
                img: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1000&q=80",
                installs: "1.2k",
                rating: 4.5,
                price: "¥129/月",
              },
              {
                id: 3,
                title: "数据可视化引擎",
                img: "https://images.unsplash.com/photo-1561736778-92e52a7769ef?auto=format&fit=crop&w=1950&q=80",
                installs: 856,
                rating: 4.2,
                price: "¥299/年",
              },
            ].map((plugin) => (
              <li key={plugin.id} className="explore-item">
                <Image
                  src={plugin.img}
                  alt={plugin.title}
                  className="explore-item-image"
                  width={60}
                  height={60}
                />
                <div className="explore-item-info">
                  <h3 className="explore-item-title">{plugin.title}</h3>
                  <div className="explore-item-meta">
                    <span>
                      <i className="ri-download-line" /> {plugin.installs}{" "}
                      部署
                    </span>
                    <span>
                      <i className="ri-star-fill" /> {plugin.rating} 分
                    </span>
                    <span>
                      <i className="ri-price-tag-3-line" /> {plugin.price}
                    </span>
                  </div>
                  <div className="explore-item-actions">
                    <Link href="#" className="btn btn-sm btn-outline">
                      编辑
                    </Link>
                    <Link href="#" className="btn btn-sm btn-outline">
                      数据
                    </Link>
                    <Link href="#" className="btn btn-sm btn-outline">
                      评论
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
