import { getToggle, setToggle } from "../util/toggles.js";
import { wait } from "../util/wait.js";

const hardsubSwitch = document.querySelector("#hardsub-switch");
const refreshSwitch = document.querySelector("#refresh-switch");

const updateState = async () => {
  hardsubSwitch.checked = await getToggle("hardsub");
  refreshSwitch.checked = await getToggle("refresh");

  refreshSwitch.disabled = !hardsubSwitch.checked;
};

const hardsubSwitchHandler = async (ev) => {
  console.log("clicked hardsub switch");
  await setToggle("hardsub", hardsubSwitch.checked);
  await updateState();

  (async () => {
    const tabs = await browser.tabs.query({
      url: "https://www.crunchyroll.com/watch/*",
    });
    for (let t of tabs) {
      browser.tabs.reload(t.id);
      wait(500);
    }
  })();
};

const refreshSwitchHandler = async (ev) => {
  console.log("clicked refresh switch");
  await setToggle("refresh", refreshSwitch.checked);
  updateState();
};

const requiredPermissions = { origins: ["https://www.crunchyroll.com/*"] }

const requestPermissions = () => {
  browser.permissions.request(requiredPermissions, (success) => {
    if (success) {
      console.log("removing perms prompt.")
      const a = document.querySelector("#perm-fail")
      const parent = document.querySelector(".container")
      parent.removeChild(a);
    }
  })
}

const checkPermissions = async () => {
  console.log("checking permissions")
  console.log((await browser.permissions.getAll()).origins)
  browser.permissions.contains(requiredPermissions, (success) => {
    if (!success) {
      console.log("creating perms prompt.")
      const check = document.querySelectorAll("#perm-fail")
      if (check.length > 0) {
        return
      }
      const a = document.createElement("a");
      a.id = "perm-fail"
      a.href = "javascript:void()";
      a.onclick = requestPermissions
      const text = document.createTextNode("insufficient permissions. click here to grant.")
      a.appendChild(text);
      const div = document.querySelector(".title");
      const parent = document.querySelector(".container")
      parent.insertBefore(a, div);
    } else {
      console.log("has permissions.")
    }
  })
}

hardsubSwitch.addEventListener("change", hardsubSwitchHandler);
refreshSwitch.addEventListener("change", refreshSwitchHandler);

updateState();
checkPermissions();