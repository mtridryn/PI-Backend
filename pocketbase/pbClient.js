const PocketBase = require('pocketbase/cjs');
require('dotenv').config();

const pb = new PocketBase(process.env.POCKETBASE_URL);
module.exports = pb;