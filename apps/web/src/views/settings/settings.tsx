import { Outlet } from "react-router";

const Settings = () => {
  return (
    <div className="mid_sec">
      <div className="form_sec full">
        <Outlet />
      </div>
    </div>
  );
};

export default Settings;
