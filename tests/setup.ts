import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Point behavior logs to a writable temp directory for tests
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'co-ts-jest-'));
process.env.CONNECTONION_HOME = tmp;

// Tests do not auto-load .env; if the SDK needs keys, let it crash to prompt config
