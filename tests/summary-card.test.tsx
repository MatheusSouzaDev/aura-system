import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test, { after } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PiggyBankIcon, WalletIcon } from "lucide-react";
import SummaryCard from "../app/(home)/_components/summary-card";

const SNAPSHOT_SOURCE = path.resolve(
  process.cwd(),
  "tests",
  "__snapshots__",
  "summary-card.snap.json",
);
const SNAPSHOT_FILE = path.resolve(
  __dirname,
  "__snapshots__",
  "summary-card.snap.json",
);
let snapshots: Record<string, string> = {};
let snapshotsChanged = false;

const snapshotPathToRead = fs.existsSync(SNAPSHOT_SOURCE)
  ? SNAPSHOT_SOURCE
  : SNAPSHOT_FILE;

if (fs.existsSync(snapshotPathToRead)) {
  snapshots = JSON.parse(
    fs.readFileSync(snapshotPathToRead, "utf-8"),
  ) as Record<string, string>;
}

const writeSnapshots = () => {
  if (!snapshotsChanged) {
    return;
  }

  const serialized = JSON.stringify(snapshots, null, 2);

  fs.mkdirSync(path.dirname(SNAPSHOT_SOURCE), { recursive: true });
  fs.writeFileSync(SNAPSHOT_SOURCE, serialized);

  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  fs.writeFileSync(SNAPSHOT_FILE, serialized);
};

after(writeSnapshots);

const matchSnapshot = (name: string, value: string) => {
  if (process.env.UPDATE_SNAPSHOTS === "true" || !(name in snapshots)) {
    snapshots[name] = value;
    snapshotsChanged = true;
    return;
  }

  assert.strictEqual(value, snapshots[name]);
};

test("SummaryCard renders small card snapshot", () => {
  const markup = renderToStaticMarkup(
    <SummaryCard
      icon={<PiggyBankIcon size={16} />}
      title="Investido"
      amount={500}
    />,
  );

  matchSnapshot("small", markup);
});

test("SummaryCard renders large card snapshot", () => {
  const markup = renderToStaticMarkup(
    <SummaryCard
      icon={<WalletIcon size={16} />}
      title="Saldo"
      amount={1250}
      size="large"
      previousAmount={1000}
      difference={250}
      userCanAddTransaction
    />,
  );

  matchSnapshot("large", markup);
});
