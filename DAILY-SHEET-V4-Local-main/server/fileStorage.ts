import path from "path";
import fs from "fs";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Response } from "express";
import { Readable } from "stream";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME;

function getR2Client(): S3Client | null {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
  });
}

const r2 = getR2Client();

function r2Key(fileName: string): string {
  return `uploads/${fileName}`;
}

export async function saveFile(fileName: string, data: Buffer): Promise<string> {
  if (r2 && R2_BUCKET) {
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key(fileName),
      Body: data,
    }));
    return `/obj/${fileName}`;
  }
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  fs.writeFileSync(path.join(uploadDir, fileName), data);
  return `/uploads/${fileName}`;
}

export async function saveFileFromDisk(diskPath: string, fileName: string): Promise<string> {
  if (r2 && R2_BUCKET) {
    const data = fs.readFileSync(diskPath);
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key(fileName),
      Body: data,
    }));
    try { fs.unlinkSync(diskPath); } catch (_) {}
    return `/obj/${fileName}`;
  }
  return `/uploads/${fileName}`;
}

export async function getFileBuffer(url: string): Promise<Buffer | null> {
  if (url.startsWith("/obj/") && r2 && R2_BUCKET) {
    const fileName = url.slice(5);
    try {
      const res = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: r2Key(fileName) }));
      const chunks: Buffer[] = [];
      for await (const chunk of res.Body as Readable) chunks.push(Buffer.from(chunk));
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }
  const filePath = path.join(process.cwd(), url);
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
  return null;
}

export async function streamFileToResponse(url: string, res: Response, contentType: string, displayName: string, inline: boolean): Promise<boolean> {
  if (url.startsWith("/obj/") && r2 && R2_BUCKET) {
    const fileName = url.slice(5);
    try {
      const obj = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: r2Key(fileName) }));
      res.setHeader("Content-Type", contentType);
      const disposition = inline ? "inline" : "attachment";
      res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(displayName)}"`);
      if (obj.ContentLength) res.setHeader("Content-Length", String(obj.ContentLength));
      (obj.Body as Readable).pipe(res);
      return true;
    } catch {
      return false;
    }
  }
  const filePath = path.join(process.cwd(), url);
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", contentType);
    const disposition = inline ? "inline" : "attachment";
    res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(displayName)}"`);
    res.sendFile(filePath);
    return true;
  }
  return false;
}

export async function deleteStoredFile(url: string): Promise<void> {
  if (url.startsWith("/obj/") && r2 && R2_BUCKET) {
    const fileName = url.slice(5);
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: r2Key(fileName) }));
    } catch (_) {}
    return;
  }
  const diskPath = path.join(process.cwd(), url);
  if (fs.existsSync(diskPath)) {
    try { fs.unlinkSync(diskPath); } catch (_) {}
  }
}

export async function getPresignedUploadUrl(fileName: string): Promise<string> {
  if (!r2 || !R2_BUCKET) throw new Error("R2 not configured");
  return getSignedUrl(r2, new PutObjectCommand({ Bucket: R2_BUCKET, Key: r2Key(fileName) }), { expiresIn: 900 });
}
