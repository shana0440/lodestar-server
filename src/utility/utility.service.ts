import { createCipheriv, createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { camelCase, isArray, isDate, isObject, transform } from 'lodash';

@Injectable()
export class UtilityService {
  generateMD5Hash(target: string) {
    return createHash('md5').update(target).digest('hex');
  }

  encrypt(hashKey: string, iv: string, data: string): string {
    const cipher = createCipheriv('aes-256-cbc', hashKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  sleep(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  arrayBufferToBase64Url(buffer: any): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  objectToBase64url(payload: any): string {
    return this.arrayBufferToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  }

  convertObjectKeysToCamelCase(obj): any {
    return transform(obj, (acc, value, key, target) => {
      const camelKey = isArray(target) ? key : camelCase(key as any);
      acc[camelKey] = isDate(value) ? value : isObject(value) ? this.convertObjectKeysToCamelCase(value) : value;
    });
  }
}
