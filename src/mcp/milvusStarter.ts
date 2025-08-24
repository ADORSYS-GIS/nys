import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';
import * as vscode from 'vscode';
import { spawn } from 'child_process';

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

function parseHostPort(address?: string): { host: string; port: number } {
  try {
    const def = { host: '127.0.0.1', port: 19530 };
    if (!address) return def;
    // Allow url-like inputs
    const cleaned = String(address).replace(/^grpc:\/\//, '').replace(/^http[s]?:\/\//, '');
    const [host, portStr] = cleaned.split(':');
    const port = Number(portStr || 19530);
    if (!host || Number.isNaN(port)) return def;
    return { host, port };
  } catch {
    return { host: '127.0.0.1', port: 19530 };
  }
}

async function isReachable(host: string, port: number, timeoutMs = 400): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const socket = new net.Socket();
    let done = false;
    const onFinish = (ok: boolean) => { if (!done) { done = true; try { socket.destroy(); } catch {} resolve(ok); } };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => onFinish(true));
    socket.once('timeout', () => onFinish(false));
    socket.once('error', () => onFinish(false));
    try { socket.connect(port, host); } catch { onFinish(false); }
  });
}

let started = false;
export async function ensureMilvusStarted(cfg: {
  milvusStartDocker?: boolean;
  milvusDockerComposeFile?: string;
  milvusDockerImage?: string;
  milvusContainerName?: string;
  milvusAddress?: string;
  milvusWaitSeconds?: number;
}): Promise<void> {
  try {
    const { host, port } = parseHostPort(cfg.milvusAddress);
    // Quick reachability probe only; no autostart
    const attempts = Math.max(1, Math.min(5, Number(cfg.milvusWaitSeconds || 3)));
    const altHosts: string[] = [];
    if (host === 'localhost') altHosts.push('127.0.0.1');
    else if (host === '127.0.0.1') altHosts.push('localhost');
    else if (host === '0.0.0.0') altHosts.push('127.0.0.1', 'localhost');

    for (let i = 0; i < attempts; i++) {
      if (await isReachable(host, port, 600)) {
        try { console.log(`[MilvusStarter] Milvus reachable at ${host}:${port} (attempt ${i + 1}/${attempts}).`); } catch {}
        started = true;
        return;
      }
      // Try alternate loopback hosts within the same attempt without extra delay
      for (const h of altHosts) {
        if (await isReachable(h, port, 600)) {
          try { console.log(`[MilvusStarter] Milvus reachable at ${h}:${port} (attempt ${i + 1}/${attempts}).`); } catch {}
          started = true;
          return;
        }
      }
      await sleep(500);
    }
    try {
      console.warn('[MilvusStarter] Milvus not reachable at', `${host}:${port}`, '- please start your Milvus (e.g., docker run milvus) or update mcpClient.milvusAddress. Autostart is disabled.');
    } catch {}
  } catch (e) {
    try { console.warn('[MilvusStarter] Reachability check failed:', e); } catch {}
  }
}
