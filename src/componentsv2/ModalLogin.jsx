import React from "react";
import { Modal } from "pi-ui";
import LoginForm from "src/containers/User/Login/Form";
import useOnRouteChange from "src/hooks/utils/useOnRouteChange";

const ModalLogin = ({ title = "Login", onLoggedIn, onClose, ...props }) => {
  useOnRouteChange(onClose);
  return (
    <Modal
      title={title}
      onClose={onClose}
      iconType="info"
      iconSize="lg"
      {...props}
      contentStyle={{ width: "100%" }}
      titleStyle={{ paddingRight: "4rem" }}
    >
      <LoginForm
        onLoggedIn={onLoggedIn}
        hideTitle
        redirectToPrivacyPolicyRoute
      />
    </Modal>
  );
};

export default React.memo(ModalLogin);