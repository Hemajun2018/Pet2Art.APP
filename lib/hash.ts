import { SnowflakeIdv1 } from "simple-flakeid";
import { v4 as uuidv4 } from "uuid";

// 创建单例雪花算法生成器
// 使用单例模式避免并发时生成重复ID
// workerId 可以根据实际部署环境设置（例如从环境变量读取）
const snowflakeGenerator = new SnowflakeIdv1({ 
  workerId: process.env.WORKER_ID ? parseInt(process.env.WORKER_ID) : 1 
});

export function getUuid(): string {
  return uuidv4();
}

export function getUniSeq(prefix: string = ""): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);

  return `${prefix}${randomPart}${timestamp}`;
}

export function getNonceStr(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters[randomIndex];
  }

  return result;
}

export function getSnowId(): string {
  // 使用单例生成器，保证在同一时间戳内序列号会自动递增
  const snowId = snowflakeGenerator.NextId();
  return snowId.toString();
}
