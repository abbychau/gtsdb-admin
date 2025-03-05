import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DEFAULT_API_URL } from '../app/settings-context'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

interface ApiOptions {
  method?: string;
  body?: any;
}

const API_ENDPOINT = '/api/tsdb';

export async function fetchApi(options: ApiOptions) {
  const { method = 'POST', body } = options;
  const bodyString = body ? JSON.stringify(body) : undefined;
  let apiUrl = DEFAULT_API_URL;
  // get from local storage: gtsdb-settings
  const lsString = localStorage.getItem('gtsdb-settings');
  if (lsString) {
    const settings = JSON.parse(lsString);
    apiUrl = settings.apiUrl;
  }

  const response = await fetch(API_ENDPOINT, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-url': apiUrl
    },
    body: bodyString
  });

  return await response.json();
}
