interface AddTransactionButtonProps {
  userCanAddTransaction?: boolean;
  accounts: { id: string; name: string }[];
}

const AddTransactionButton = ({
  userCanAddTransaction,
}: AddTransactionButtonProps) => (
  <div
    data-testid="add-transaction-button"
    data-enabled={userCanAddTransaction ? "true" : "false"}
  />
);

export default AddTransactionButton;
