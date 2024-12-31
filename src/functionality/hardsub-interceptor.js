const loadModule = async (path) => {
  const src = browser.runtime.getURL(path);
  const contentMain = await import(src);
  return contentMain.default;
};

let getToggle = async () => {
  console.warn("getToggle() not properly loaded");
};

loadModule("src/util/toggles.js").then((res) => {
  getToggle = res.getToggle;
});

const wr = browser.webRequest;

const defaultLocale = "en-US";
let locale = defaultLocale;

// because it's substituting the subtitles! get it? get it? get it?
const subSub = (requestDetails) => {
  const url = new URL(requestDetails.url);

  // there's prob a neater way to do this, but this works for now
  if ("locale" in url.searchParams) {
    locale = url.searchParams["locale"];
  }

  if (
    url.host == "www.crunchyroll.com" &&
    url.pathname.endsWith("play") &&
    requestDetails.method == "GET"
  ) {
    const filter = wr.filterResponseData(requestDetails.requestId);
    const dataArr = [];
    filter.ondata = (event) => {
      dataArr.push(event.data);
    };
    filter.onstop = async () => {
      if (dataArr.length == 0) {
        filter.close();
        return;
      }
      const shouldSub = await getToggle("hardsub");
      const blob = new Blob(dataArr);
      // i think putting the toggle here will slightly slow down
      // loading even then turned off, but oh well
      const info = JSON.parse(await blob.text());
      console.log("captured play info");

      if (shouldSub) {
        const origUrl = info.url;
        const hardsubInfo =
          locale in info.hardSubs
            ? info.hardSubs[locale]
            : info.hardSubs[defaultLocale];
        const newUrl = hardsubInfo.url;
        console.log(`locale: ${locale}; fallback: ${defaultLocale}`);
        console.log(`changing video url from ${origUrl} to ${newUrl}`);
        info.url = newUrl;
        console.log("stripping subtitle data");
        info.subtitles = {};
      } else {
        console.log("bypass hardsub change");
      }

      const data = new TextEncoder().encode(JSON.stringify(info));
      filter.write(data);
      filter.close();
    };
  }
};

wr.onBeforeRequest.addListener(
  subSub,
  {
    urls: ["<all_urls>"],
  },
  ["blocking"]
);
