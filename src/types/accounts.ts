export type AccountType = "LDAP" | "LOCAL";

export type LabelItem = { text: string };

export type Account = {
  id: string;
  label: LabelItem[];
  type: AccountType;
  login: string;
  password: string | null;
  touched: {
    label: boolean;
    type: boolean;
    login: boolean;
    password: boolean;
  };
};