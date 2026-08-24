import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'wheels.json');

async function ensureStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify({ wheels: [] }, null, 2),
      'utf8'
    );
  }
}

async function readData() {
  await ensureStorage();

  const raw = await fs.readFile(DATA_FILE, 'utf8');

  try {
    return JSON.parse(raw);
  } catch {
    return { wheels: [] };
  }
}

async function writeData(data) {
  await ensureStorage();

  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

function generateId() {
  return `wheel_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}

export async function getWheels() {
  const data = await readData();
  return data.wheels || [];
}

export async function getWheel(id) {
  const wheels = await getWheels();
  return wheels.find(wheel => wheel.id === id);
}

export async function createWheel(name, entries, color = 'uplup') {
  const data = await readData();

  const wheel = {
    id: generateId(),
    name,
    entries,
    color,
    createdAt: new Date().toISOString(),
    spins: []
  };

  data.wheels.push(wheel);

  await writeData(data);

  return wheel;
}

export async function deleteWheel(id) {
  const data = await readData();

  const index = data.wheels.findIndex(wheel => wheel.id === id);

  if (index === -1) {
    return false;
  }

  data.wheels.splice(index, 1);

  await writeData(data);

  return true;
}

export async function recordSpin(id, winner) {
  const data = await readData();

  const wheel = data.wheels.find(wheel => wheel.id === id);

  if (!wheel) {
    return null;
  }

  wheel.spins.push({
    winner,
    timestamp: new Date().toISOString()
  });

  await writeData(data);

  return wheel;
}
