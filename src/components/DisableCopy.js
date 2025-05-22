import React, { useEffect } from "react";

const DisableCopy = ({ isAdmin }) => {
  useEffect(() => {
    if (!isAdmin) {
      // Copy, Cut, Paste Disable
      const disableCopy = (e) => e.preventDefault();
      document.addEventListener("copy", disableCopy);
      document.addEventListener("cut", disableCopy);
      document.addEventListener("paste", disableCopy);

      // Right Click Disable
      document.addEventListener("contextmenu", disableCopy);

      // Selection Disable
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("copy", disableCopy);
        document.removeEventListener("cut", disableCopy);
        document.removeEventListener("paste", disableCopy);
        document.removeEventListener("contextmenu", disableCopy);
        document.body.style.userSelect = "auto";
      };
    }
  }, [isAdmin]);

  return null;
};

export default DisableCopy;
