import { AttackType } from "@/miner";

export type Wordlist = {
  path: string;
  enabled: boolean;
  attackTypes: AttackType[];
};
