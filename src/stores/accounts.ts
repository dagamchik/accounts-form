import { defineStore } from "pinia";
import type { Account, AccountType, LabelItem } from "@/types/accounts";

const LS_KEY = "accounts_form_v1";

function uid() {
  return crypto.randomUUID?.() ?? String(Date.now() + Math.random());
}

function parseLabelToArray(raw: string): LabelItem[] {
  return raw
    .split(";")
    .map(s => s.trim())
    .filter(Boolean)
    .map(text => ({ text }));
}

export const useAccountsStore = defineStore("accounts", {
  state: () => ({
    accounts: [] as Account[],
  }),
  actions: {
    initFromStorage() {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      try {
        this.accounts = JSON.parse(raw) as Account[];
      } catch {
        // ignore
      }
    },
    persist() {
      localStorage.setItem(LS_KEY, JSON.stringify(this.accounts));
    },
    addAccount() {
      const a: Account = {
        id: uid(),
        label: [],
        type: "LOCAL",
        login: "",
        password: "",
        touched: { label: false, type: false, login: false, password: false },
      };
      this.accounts.push(a);
      this.persist();
    },
    removeAccount(id: string) {
      this.accounts = this.accounts.filter(a => a.id !== id);
      this.persist();
    },
    setTouched(id: string, field: keyof Account["touched"], value: boolean) {
      const a = this.accounts.find(x => x.id === id);
      if (!a) return;
      a.touched[field] = value;
      this.persist();
    },
    setType(id: string, type: AccountType) {
      const a = this.accounts.find(x => x.id === id);
      if (!a) return;

      a.type = type;
      if (type === "LDAP") a.password = null;
      if (type === "LOCAL" && a.password === null) a.password = "";

      this.persist();
    },
    setLogin(id: string, login: string) {
      const a = this.accounts.find(x => x.id === id);
      if (!a) return;
      a.login = login;
      this.persist();
    },
    setPassword(id: string, password: string) {
      const a = this.accounts.find(x => x.id === id);
      if (!a) return;
      a.password = password;
      this.persist();
    },
    setLabelFromRaw(id: string, raw: string) {
      const a = this.accounts.find(x => x.id === id);
      if (!a) return;
      a.label = parseLabelToArray(raw);
      this.persist();
    },
  },
});