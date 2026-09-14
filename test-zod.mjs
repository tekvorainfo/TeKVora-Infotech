import { z, ZodError } from 'zod';
console.log('z keys:', Object.keys(z));
console.log('Is z.object a function?', typeof z.object === 'function');
console.log('Is z.literal a function?', typeof z.literal === 'function');
console.log('Does z.ZodError exist?', !!z.ZodError);
