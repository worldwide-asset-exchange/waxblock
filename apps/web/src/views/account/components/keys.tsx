import AccountPermissions from "../../wallet/components/account-permissions";

const Keys = ({ account, accInfo }) => {
  const permissions = account ? account.permissions : null;
  const linkAuth = accInfo ? accInfo.linkauth : null;

  return (
    <>
      <AccountPermissions permissions={permissions} linkAuth={linkAuth} />
    </>
  );
};

export default Keys;
