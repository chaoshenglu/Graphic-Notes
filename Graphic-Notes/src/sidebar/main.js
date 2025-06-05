import { createApp } from "vue";
import { createPinia } from "pinia";
import OSS from "ali-oss";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import App from "./App.vue";
import "./style.css"; // 全局样式

const app = createApp(App);

app.use(createPinia());

app.mount("#app");

axios.get("https://api.tiffanylamps.com.cn/sts").then(function (response) {
  const config = response.data || {};
  const accessKeyId = config.AccessKeyId || "1";
  const accessKeySecret = config.AccessKeySecret || "1";
  const stsToken = config.SecurityToken || "1";
  const client = new OSS({
    region: "oss-cn-shanghai",
    accessKeyId,
    accessKeySecret,
    stsToken,
    bucket: "web-note",
    secure: true,
  });
  window.client = client;

  // 封装上传图片的方法
  window.uploadImage = async function (file) {
    if (!file) {
      console.error("No file selected.");
      return null;
    }

    // 1. 检查文件类型
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/avif",
    ];
    if (!allowedTypes.includes(file.type)) {
      console.error(
        "Invalid file type. Only PNG, JPG, WEBP, AVIF are allowed."
      );
      alert("文件类型无效，仅支持 PNG, JPG, WEBP, AVIF 格式的图片。");
      return null;
    }

    // 2. 检查文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      console.error("File size exceeds 5MB limit.");
      alert("文件大小超过 5MB 限制。");
      return null;
    }

    try {
      const options = {
        mime: file.type, // 使用文件的实际 MIME 类型
        headers: { "Content-Type": file.type }, // Content-Type 也应为文件的MIME类型
      };

      const suffix = file.name.split(".").pop();
      const key = `${uuidv4()}.${suffix}`; // 使用 uuid 生成唯一文件名

      const result = await window.client.put(`${key}`, file, options);
      console.log("Upload successful:", result);
      return {
        key: key, // 添加key信息，方便后续删除
        url: result.url,
      };
    } catch (e) {
      console.error("Upload failed:", e);
      alert("图片上传失败，请稍后重试。");
      return null;
    }
  };

  // 添加删除图片的方法
  window.deleteImage = async function (key) {
    if (!key) {
      console.error("No key provided for image deletion");
      return false;
    }

    try {
      const result = await window.client.delete(key);
      console.log("Image deleted successfully:", result);
      return true;
    } catch (e) {
      console.error("Failed to delete image:", e);
      return false;
    }
  };
});
