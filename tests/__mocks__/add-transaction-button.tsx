interface AddTransactionButtonProps {
  userCanAddTransaction?: boolean;
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
