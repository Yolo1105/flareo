// src/index.js
import componentHTML from './component.html';

export const injectComponent = (targetSelector) => {
  const target = document.querySelector(targetSelector);
  if (target) {
    target.innerHTML = componentHTML;
  } else {
    console.error('目标元素不存在');
  }
};