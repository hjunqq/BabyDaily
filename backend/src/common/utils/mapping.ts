export function mapToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => mapToCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/(_\w)/g, (m) => m[1].toUpperCase())]: mapToCamelCase(
          obj[key],
        ),
      }),
      {},
    );
  }
  return obj;
}
