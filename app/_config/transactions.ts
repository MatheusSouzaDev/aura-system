import { TransactionPaymentMethod, TransactionType } from "@prisma/client";

export const TRANSACTION_CATEGORY_LABELS = {
  EDUCATION: "Educacao",
  ENTERTAIMENT: "Entretenimento",
  FOOD: "Alimentacao",
  HELTH: "Saude",
  HOUSING: "Moradia",
  OTHER: "Outros",
  SALARY: "Salario",
  TRANSPORTATION: "Transporte",
  UTILITY: "Utilidades",
  INVESTMENT: "Investimento",
};

export const TRANSACTION_PAYMENT_METHOD_LABELS = {
  PIX: "Pix",
  CASH: "Dinheiro",
  DEBIT_CARD: "Cartao de Debito",
  CREDIT_CARD: "Cartao de Credito",
  BANK_SLIP: "Boleto Bancario",
  BANK_TRANSFER: "Transferencia Bancaria",
  OTHER: "Outros",
};

export const TRANSACTION_PAYMENT_METHOD_ICONS = {
  [TransactionPaymentMethod.CREDIT_CARD]: "credit-card.svg",
  [TransactionPaymentMethod.DEBIT_CARD]: "debit-card.svg",
  [TransactionPaymentMethod.BANK_TRANSFER]: "bank-transfer.svg",
  [TransactionPaymentMethod.BANK_SLIP]: "bank-slip.svg",
  [TransactionPaymentMethod.CASH]: "money.svg",
  [TransactionPaymentMethod.PIX]: "pix.svg",
  [TransactionPaymentMethod.OTHER]: "other.svg",
};

export const TRANSACTION_TYPE_OPTIONS = [
  {
    label: "Despesa",
    value: TransactionType.EXPENSE,
  },
  {
    label: "Receita",
    value: TransactionType.DEPOSIT,
  },
  {
    label: "Transferencia",
    value: TransactionType.TRANSFER,
  },
];

export const PAYMENT_METHOD_OPTIONS = [
  {
    label: TRANSACTION_PAYMENT_METHOD_LABELS.PIX,
    value: "PIX",
  },
  {
    label: TRANSACTION_PAYMENT_METHOD_LABELS.CASH,
    value: "CASH",
  },
  {
    label: TRANSACTION_PAYMENT_METHOD_LABELS.BANK_SLIP,
    value: "BANK_SLIP",
  },
  {
    label: TRANSACTION_PAYMENT_METHOD_LABELS.DEBIT_CARD,
    value: "DEBIT_CARD",
  },
  {
    label: TRANSACTION_PAYMENT_METHOD_LABELS.CREDIT_CARD,
    value: "CREDIT_CARD",
  },
  {
    label: TRANSACTION_PAYMENT_METHOD_LABELS.BANK_TRANSFER,
    value: "BANK_TRANSFER",
  },
  {
    label: TRANSACTION_PAYMENT_METHOD_LABELS.OTHER,
    value: "OTHER",
  },
];

export const TRANSACTION_CATEGORY_OPTIONS = [
  {
    label: TRANSACTION_CATEGORY_LABELS.EDUCATION,
    value: "EDUCATION",
  },
  {
    label: TRANSACTION_CATEGORY_LABELS.ENTERTAIMENT,
    value: "ENTERTAIMENT",
  },
  {
    label: TRANSACTION_CATEGORY_LABELS.FOOD,
    value: "FOOD",
  },
  {
    label: TRANSACTION_CATEGORY_LABELS.HELTH,
    value: "HELTH",
  },
  {
    label: TRANSACTION_CATEGORY_LABELS.HOUSING,
    value: "HOUSING",
  },
  {
    label: TRANSACTION_CATEGORY_LABELS.SALARY,
    value: "SALARY",
  },
  {
    label: TRANSACTION_CATEGORY_LABELS.TRANSPORTATION,
    value: "TRANSPORTATION",
  },
  {
    label: TRANSACTION_CATEGORY_LABELS.UTILITY,
    value: "UTILITY",
  },
  {
    label: TRANSACTION_CATEGORY_LABELS.OTHER,
    value: "OTHER",
  },
  {
    label: TRANSACTION_CATEGORY_LABELS.INVESTMENT,
    value: "INVESTMENT",
  },
];
