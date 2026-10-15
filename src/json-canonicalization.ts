function assertWellFormedUnicode(value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++index);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new Error('JCS cannot canonicalize a lone Unicode surrogate');
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new Error('JCS cannot canonicalize a lone Unicode surrogate');
    }
  }
}

export function canonicalizeJson(value: unknown): string {
  if (value === null || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    assertWellFormedUnicode(value);
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('JCS cannot canonicalize a non-finite number');
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeJson(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const entries = Object.keys(object).sort().map((key) => {
      assertWellFormedUnicode(key);
      return `${JSON.stringify(key)}:${canonicalizeJson(object[key])}`;
    });
    return `{${entries.join(',')}}`;
  }
  throw new Error('JCS requires a JSON-compatible value');
}
