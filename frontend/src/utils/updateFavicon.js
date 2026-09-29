// Dynamic Favicon and Tab Bar Updater
export const updateFavicon = (logoUrl) => {
  if (!logoUrl) return;

  const linkSelectors = [
    "link[rel*='icon']",
    "link[rel='apple-touch-icon']",
    "link[rel='shortcut icon']"
  ];

  linkSelectors.forEach((selector) => {
    const existingLinks = document.querySelectorAll(selector);
    existingLinks.forEach((link) => link.remove());
  });

  const head = document.getElementsByTagName("head")[0];
  if (!head) return;

  const newIcon = document.createElement("link");
  newIcon.type = "image/png";
  newIcon.rel = "icon";
  newIcon.href = logoUrl;
  head.appendChild(newIcon);

  const appleIcon = document.createElement("link");
  appleIcon.rel = "apple-touch-icon";
  appleIcon.href = logoUrl;
  head.appendChild(appleIcon);
};

export const notifySettingsUpdated = () => {
  window.dispatchEvent(new Event("restaurantSettingsUpdated"));
};
