const K = "sy1",
  CL = { A: "#fd6f75", B: "#6ecb7c", C: "#f6b73c" },
  EM = ["😎", "🥴", "😋", "🐻", "🐯", "🐰", "🦊", "🐸"],
  DR = ["소주", "맥주", "막걸리", "와인", "하이볼", "위스키", "사케"],
  FN = ["부유", "적당", "가난"],
  FC = { 부유: "ok", 적당: "y", 가난: "r" },
  ST = {
    pending: ["제안 대기", "y"],
    confirmed: ["술약 성립", "ok"],
    live: ["진행 중", "ok"],
    cancelled: ["성립 안 됨", "r"],
    ended: ["종료", ""],
  },
  DN = "일월화수목금토";
const LIVE = true,
  APP = (window.APP = { onSave: null });
const mk = () => ({
  me: "A",
  users: {
    A: { n: "사용자 A", e: "😎", f: "적당", a: "", bank: "", s: [], v: null },
    B: { n: "사용자 B", e: "🐻", f: "적당", a: "", bank: "", s: [], v: null },
    C: { n: "사용자 C", e: "🐸", f: "적당", a: "", bank: "", s: [], v: null },
  },
  P: [],
  fav: [],
});
let S = mk();
S.fav = S.fav || [];
for (const k of ["A", "B", "C"])
  if (S.users?.[k])
    S.users[k].v = Array.isArray(S.users[k].v)
      ? S.users[k].v
      : S.users[k].v?.a && S.users[k].v?.d
        ? (() => {
            const a = [],
              x = new Date(S.users[k].v.a + "T00:00"),
              z = new Date(S.users[k].v.d + "T00:00");
            for (let q = new Date(x); q <= z; q.setDate(q.getDate() + 1))
              a.push(iso(q));
            return a;
          })()
        : [];
let V = { v: "home" },
  hist = [],
  M = null,
  AC = null,
  G = 0,
  SD = 0,
  lastHit = 0,
  base = 0.02,
  LV = 0,
  firing = 0,
  T = "me",
  cm = 0,
  stream2 = null,
  scheduleEditing = false,
  scheduleDraft = [];
const sv = () => {
  if (APP.onSave) APP.onSave();
};
const h = (s) =>
  s == null
    ? ""
    : String(s).replace(
        /[&<>"]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
      );
const $ = (i) => document.getElementById(i),
  me = () => S.users[S.me],
  P = () => S.P.find((p) => p.id == V.id),
  nm = (k) => S.users[k].n;
function iso(d) {
  const z = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
}
const fd = (d) => {
  const t = new Date(d + "T00:00");
  return isNaN(t)
    ? "-"
    : `${t.getMonth() + 1}/${t.getDate()}(${DN[t.getDay()]})`;
};
const won = (n) => (+n || 0).toLocaleString("ko-KR") + "원";
function toast(m) {
  const e = document.createElement("div");
  e.className = "toast";
  e.textContent = m;
  document.body.append(e);
  setTimeout(() => e.remove(), 2400);
}
function stopMedia() {
  if (M) {
    M.getTracks().forEach((t) => t.stop());
    M = null;
  }
  if (AC) {
    AC.close();
    AC = null;
  }
  if (stream2) {
    stream2.getTracks().forEach((t) => t.stop());
    stream2 = null;
  }
}
function go(v, id) {
  scheduleEditing = false;
  stopMedia();
  hist.push([V.v, V.id]);
  V = { v, id };
  R();
  scrollTo(0, 0);
}
function back() {
  scheduleEditing = false;
  const p = hist.pop();
  stopMedia();
  if (p) {
    V = { v: p[0], id: p[1] };
  } else {
    V = { v: "home", id: undefined };
  }
  R();
  scrollTo(0, 0);
}
function swap(k) {
  if (LIVE) return;
  scheduleEditing = false;
  S.me = k;
  sv();
  R();
}
function upd(f) {
  f();
  sv();
  R();
}
let PD = null; // 정산 입력 중인 값
const TT = {
  home: "홈",
  profile: "프로필",
  cal: "본가 방문 일정",
  songs: "노래방 선곡",
  new: "술약 제안",
  d: "술약",
  plan: "계획",
  cam: "사진 촬영",
  start: "시작",
  drunk: "오늘의 만취자",
  pay: "정산",
  rec: "술약 기록",
  arc: "아카이브",
  favs: "술집 리스트",
};
function R() {
  // 서버 데이터가 바뀌어 보고 있던 술약이 사라졌으면 홈으로 (로그아웃·되돌림 때)
  if (
    ["d", "plan", "start", "drunk", "cam", "pay", "rec"].includes(V.v) &&
    !S.P.find((p) => p.id == V.id)
  ) {
    hist = [];
    V = { v: "home" };
  }
  if (V.v !== "pay") {
    commitPay();
    PD = null;
  }
  $("top").innerHTML =
    `<div class="top">${V.v != "home" ? '<button class="u" onclick="back()" aria-label="뒤로">←</button>' : ""}<b>${TT[V.v]}</b><span class="av" style="width:42px;height:42px;font-size:23px;background:${CL[S.me]}" title="${h(nm(S.me))}">${me().e}</span><button class="u" onclick="APP.logout&&APP.logout()" aria-label="로그아웃">로그아웃</button></div>`;
  $("app").innerHTML = VW[V.v]();
  if (V.v == "home" && M && $("cam")) {
    $("cam").srcObject = M;
    $("cam").parentElement.classList.add("on"); // 카메라가 켜지면 안내 사진은 숨겨요
  }
  if (V.v == "cam") startCam();
  if (V.v == "start") startHandCam("sv", "start");
  if (V.v == "drunk" && DRK.ph === "aim") startHandCam("dv", "drunk");
}
const chipU = (k) =>
  `<span class="chip" style="background:${CL[k]};color:#161616">${h(nm(k))}</span>`;
const av = (k) =>
  `<div class="av" style="background:${CL[k]}">${S.users[k].e}</div>`;
function datesOf(v) {
  if (Array.isArray(v)) return v;
  if (v && v.a && v.d) {
    const out = [],
      a = new Date(v.a + "T00:00"),
      d = new Date(v.d + "T00:00");
    for (let x = new Date(a); x <= d; x.setDate(x.getDate() + 1))
      out.push(iso(x));
    return out;
  }
  return [];
}
function calendarGrid(only, editable = false) {
  const t = new Date(),
    d0 = new Date(t.getFullYear(), t.getMonth() + cm, 1),
    y = d0.getFullYear(),
    m = d0.getMonth(),
    n = new Date(y, m + 1, 0).getDate(),
    ks = only ? [only] : ["A", "B", "C"];
  let c =
    [...DN].map((x) => `<div class="h">${x}</div>`).join("") +
    '<div style="visibility:hidden;border:0"></div>'.repeat(d0.getDay());
  for (let d = 1; d <= n; d++) {
    const date = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      marked = editable
        ? scheduleDraft.includes(date)
        : ks.some((k) => datesOf(S.users[k].v).includes(date));
    c += `<div ${editable ? `role="button" tabindex="0" onclick="toggleScheduleDate('${date}')" onkeydown="if(event.key==='Enter'||event.key===' ')toggleScheduleDate('${date}')" style="cursor:pointer;${marked ? "background:#f6e4a8" : ""}"` : ""}>${d}${ks
      .map((k) => {
        const hit = datesOf(S.users[k].v).includes(date);
        const draft = editable && only === S.me && scheduleDraft.includes(date);
        return hit || draft
          ? `<i style="background:${CL[k]};height:9px"></i>`
          : '<i style="background:transparent"></i>';
      })
      .join("")}</div>`;
  }
  return `<div class="row"><button class="btn sm" onclick="cm--;R()">‹</button><b style="text-align:center">${y}년 ${m + 1}월</b><button class="btn sm" onclick="cm++;R()">›</button></div><div class="cal" style="margin-top:8px">${c}</div><div style="margin-top:8px">${ks.map(chipU).join("")}</div>`;
}
const VW = {
  home() {
    const ps = [...S.P].reverse();
    return `
<div class="card"><h3>술약 제안</h3><div class="cam"><video id="cam" autoplay muted playsinline></video><div class="frame"></div><div class="big"><img class="hg" src="data:image/webp;base64,UklGRt7qAABXRUJQVlA4WAoAAAASAAAAPwEAPwEAQU5JTQYAAAAAAAAAAABBTk1GNhIAABIAABkAAPgAANkAAIwAAANWUDhMHRIAAC/4QDYQb+QgkiRFymU68Hb+HbwDXBsOIklSpFyGYxfvXx3/OYgkSZFyZveY37+YF8UMt7ZtVdXC3d01J/ScGogZhFREAxRAF0QWubu7/n+j1CIQhxFWmKGGBBJornP4wx9eOOIJAYEnLuig3PdvHz101lZBsF8xyZ9CXQvn3lDXJN4t+fsirUGpLWtW6kx2unPNjXIF7VUpa1LbRK8vYupJ6599P2jvQggdZQ1CfDLKn1QXrvznvQXihXEELZ/oKtnCEZO/O69ny/M4E3xBEo6tSMbsZHhC4B8PHHHDFEVoIYH22lcN1thijQPuGM42ICb/CL8EiXh/BApxvKtolLCCKEywwQsnvPex/nDHEjNscUIXldn70laQsP2YbQA5uGCCBT4YYLv2VQoL+hijjwU2aK82oOAv2f8fyKco2OqgxAQr1DFCzYB//z+nkRzh6d67zTtde4bbFtoT4rA4JqHF7AKiL22W8/TJ2SPnKCc5Z8vZlj1/tKgqii9fmvvxUxH9hwXZVpzoPpAsgPgmRngLZH4f/3+Urt+5uP1e/N/I4p2z4367WQu4683u8Iuzd8YSt49rp43s/ifXY5jjIPR5BSC1Y/P7P48dzk85BFpelIaI499GDU86EI45bT42klG4XkNCV9zB70cLH1CjmMyi5EGKzCIJfU8Xtl8YJ/xgrTDWT4pSpdoii3xX3Vi/MUrYOxK8pKxR2BxWobLGMnDV7M+OEH4lJLjpqjCglb0zUYL7L+ODgyMhWp3qNdooZmo36u3RGRNsJPiFGVXWlgiV8GhscOZIiCvDUMKijpRwGBn8TMJlVhpDuymeGaPSfll0gIWdymE7LthJCBQYF01dOTw5Jvj8Vi5dFx1DNELJ9YYG1k7HJ3l7LWHRFa+VsYzvjw5EXBdXHXdzX+49vT46SFYnlKA4fRwP/Pd/6dAxySYS9mMDtzN0vafN9djgwaroTGUipHA+MvDS+gSC3WbjODbISgJYX8JhPNQXgg4IJOxGA89KuMwbUGV8OBoaDEdCQQCLeGQEQH+XMDmBrOB//u9Y4KiKAUigiHnHRcQZEEGMC3bKaHh8X643jqBD7MiHR2Y0TLOzUIqNilDbW9IgkvCpT48EfkFZFwIJu9EoSVmXlbvK+5HAF7YS5ieM7eDoBUGZc+nJ8t1ROeNlpCVfH5szhDm3XxiXMzXVGTQ5R8UIw01oXu678plR2fdyGoSjMkK43lAOCXN/VLSVv1SsbijwmirUPo7FPmGtsLNRscV4Z025v/RGZf+z8sUTU+Uek/3PfJxyRJi9NCqlv+ZICDtHyLrpURkK2865oVBT80TGP41F2jm3JlrEY5S6aZdUPnVlS+uPSs0fUdMOUA5aW43L+d9s5PRu2b0Gi8wblVoOmvM02lkxIgPhHwm5lpQE98WoyPH3lKmdyelxHOJHlTQn1MZjOyplEJHEVCnz4qiU8am0FxiRMh9Q3J2WJZ2eDpuHo+LXF5Z0qnjgybGokW4YjMxje+zC3j47xxNPHn932O+2+PgGWFuhJ7v9zv74D174kOK+eqeiyPQykxovbtvnnj0/HrDf2S2wkTnrkJDA9o9/YoMvKsfmJY24pydt1cVzZ81FdNhjt9VcQU5/JLZfZoKtWmNJ13PAkeYb8+yJwxKDse6Pu8wd5/cOXR8ZiZDxPVMeP3ve3Bm+s9tiI19KvMl+i4k1HURMWcNWy+Sz0zfn94fdZm0tVw6b/+n6dx9/Uajv1R2wE4UFT1+c43j4zpbXV0fA9TDxgdk8AhaxTZA2lOWAbShFEkfBRP9Bzzn0mBB0j4Cd6ZjD4epxG+4G4Ym1yYM0szZXPx06kT1RGk007X+y19qpagDS0OuXwR4uJ9JVtIiTVGKvIUNJCMA9zcYTveG3W4dIVYV8KnrgccPiIFrIHFYYTMBlso1I9F3goDAn6RyzCQ2LPVh/Ng8jxKkpiy0sG1olriJs7LmGqKToNghzLvsI5pFNUtOvjW29kliFPvO8TlhD3MpldzKdhVFyt+Gy2RU1CKoXjmL4w7gGnbrGvZzJF1ULk+0ASf6wQW8qpB/oayAIURi38hl2yARr81I5tO+th2zv0nAOElWDYzOJ+7jowb/y6MhYkLFwgGUJRVDnxPiSUIfAsDc2qbtHYmFu+xD4Rs6OVycSDtQ9Jo265gYnYCqPzYm1FppMNztmcqexD61FcENFgO6tpvQ46IS5N9gLT9vlLwklU3WTMZMUB3qh5qK64VOLVzzqio66IdENjzqmNv/59Vo5Vhc3PaSSwnn0OfJZAW/8NK9Tjzjnj9fMasSAb7oIqPf3qvT+hoe1q1gQ9x6+JiQ8KkpuvRyw7kEBhiIv6jHhTiPVZAVYC3AcWwEaCYRJlDIJZ0+d+gUjSEf5DiqNAUTK9vptXml/XKHnJ2Fbte2TRMjZjF559RM5nRbcAHQNALq0tgfxZqYeBY7U8j17SgcBWFjbRSja2pTOon+17VkcSCo06tHBr9aalGPoRTZN83GqE62kz/X+ZRL5WsWh+APlMFjn4sMyVFdov/QolVcd1HmZtY1eej7zJ26bWv7DhPHhhvPwH7D2CtWJDG//raS5hE7Uwt/3Swr4ZRJbG2GOwMfEeq6R2kzsf/CYEN/WWouy3JC+CdJlEdpg5uspAOZRCIni5ER3Uoke3EECaxdROEcws1N/4jXkEuhFd1/vycWH59aqKtI4nE1cQWZWYq0lNc8RMsn17L7WzzSvc6b78uIGbG1v9K3YbA+/JtdVfVutmeVWOtcsZ0FAjmjjonGDTTjfLIb0y4f9+Tb5HFPYSNkiMi4z5GqH5or/Wm+w3R2Of3/m9eveZlBiK/hA6htZTmnJSrcRwi/U2toNsMVuj4bN//P6w76nXf1pM4iCt2QYE09rl6Ext9FS0pBdRJB/NPyGJhJpWryzdn8Afndi8LOvv/n2tbWsLKMlBPz2EWuuoUkQp+adJtMuczp1BuAveL05geE+8B9qnEQZyeCwpetU1pjLjd4wn/JTgKF2EoqkEW6Y9fOnrDHj71/yU57dZFilNu9Ob1cwrOL+fsHd+SFgtx8pMS17kvFUV7a+qwxtuU8ktGAGZJ4j5NinxAxT5qevNxzVNqWaxlWP8cqWciKe5T0B5GXGDHbiCBbf2wnv3bfWjuCXs37gyhPAm/8VyUSY7+O9+xfRwGcGab9TXwxkSOVBLu/pjGe8APuytB+tOrSMaBO54Fvp68etUK3pGJZ276yKsu+DnoQX2OHhkzvNMrchMySuNNzKqk7XLyme5Zb/sHEALRgOiyZ5sw0A5icN5KFDwOv7tQPOcAgAkzxox2u5yw5vHdqXco54vnQRmgJy0nUbuSPhNp8+orol36s1PWWwM961Sx0MRwqdo8U9uaJ32Sztq7+nTBaRdCBuwG8ovNAC1qIrd60JQlYdp4ff1R3xXl5k9QOp4xTxgs19uaesBwAYR3TtKu+YSDs2uq15WpQWd1jChqpmJNd3FwDA7I3Mr7qU08wHTwn1TbxIEsjkZerqAICZhX6ovbbU7Lo+E6D7XTGBxmrK+1cW3WKhClvnWVWikOA5QqmIE+xUneFAv5Juq0AT0DbGBEgFn8lsDppb6Z0KpbZby1HwE2sEXoVpaG+K4ZCaTe/hqB4Ni1XZdh9wk+YwT1FfrGNmBRjB+PrG6Rib9EX1ZnqnKts81vxpEy2z5I66Cvpsqb6J6RfKFKgCh02v6YtCyZY1R7UXlnyf4+t6Bbj+LEqyEqsTVaAaH9bFKbIR+2zVWLd+Sp5bFsmkReF26c+jO1lRrWQTi64BUqvZdJo+6rRM9yj/nnF2WolcQ7/mIDwVterPirlNynKu+dV7ngE2Rl5NYBtgg25O7BN/FoRRfCeVOF+vbC2TzP5X4kaTz0hj9zXDucHYxtx3qNz4T5yfh5LNjWpoE7SYiz3Nal7TfBBRU4cXRJi6w55C570ujRsbs96i3BuvUaSLwPdEHziZi3HAV+RLNjUC43cNslXTUalWtiyyJAomL3mkWH+Y1WRRl4UZ2PaYopbusJQ1XYSBPzG96kQrPskkvrs28chmX3tUmxv5Lhv7z6AxiISR3Y2rWp+ccVpECMkwUvkjTk5vphvgmQ6GsqX0ExLMGgIQ2ghxUrwiOIk9filL9bIhpOp0crGalh2k+TWshVWHxjJJTZnJCitWC04U5XDeIuiz7Rqt9AWjnNNBnEmEnK7yvnAFW1r59DkPDChn5BhK8kHceF/CH1ng0XB8NhGaGiIYijg6IGBkZrUZDmxgrpemRcgOi5o/kE8lJCua+/eQMIQXeYF7IQE3CCJyFgC9DIQ1LwDQG5QJFgaN/g4vVkXVa+C0AOXHO09YzU9nZVfVVdUfsHQk3OLRfxiOFACxstBkVcD2B2VmCZN1ZQbs80G40pj3QHq0i57PbDiNES6Lcjhin3mvnzCT94888HMu/myURpBuUveHei7jPZwev0Gkg0A2UeUA/V2rgpX5xW0ZyaBEfbPeQj1zeD3diOrYVQxJqD3LDZTtANBhmAR1siBmBsNbjaHsEOiuq2gH40xbcff5QyGhToUuvWELWgsbauwe5onk92QC85h57Jb0+YWQ7vHDEPbloV75NAma4rUq0rtqyLw/BWmOJI2d9A2bEVq1tKb4LLpflJJSHjihS5tjV7/CC7eMYB8jQy2FOwl0NgmGuwCyuUZpxXAxxBl3AHMHBkFAsUmYNVmLU1GgbnkPNFvRpcaNlaP/g5fzBhCqcTKP4sAz0Uy5jU3CInnQPil2MvccphH/UHQ4FfshoZBNrKR3TaOpp68W0NokIJhHC5miwHcdmJzlpbULq5aEqxern52O5LAGBwB0V1ML/Zp8N6WeFjbQdJJzKG2p0KjltfPDdJ63QJlLhOMJkVb81ZS+tblVCbZaNTYJcTg10UobzMaw+QhTtzbV9YNxqrGUNrjZriDZJHS0yBC7b3N93qxH3HcVI2RE9atFO+XKqhXWLpNoPp1Yr2WuoDaBB9/de3yRkMxwAaloni0TxDYK7fxEwb9fcl+P76+C9yy3QERjx5YbreFRR+yXGt3ylnvBBoSP45OjzV8iZj8JxVccid5HBoBeuil6kvHJEKzxjmaiW57IfelMuqL9Xsov94SEAayEGd8gsNY2uMsfPxSsp8mzfSKWsB3AQv2IqQFQuqq7CTnsCbMBPBPj151eEhBtAKGin+1TKTuMhDTEPpISFIgVEUsfaj6hKGUHkhC77ImIJKSKk75cVUmIOlCVsoNIoqqUWUL0KHuguTaRTZSeE/1PkTuMp1/4ulC6jRWlFEsKUVlRifFfylZFRYpVqNoK80+opZ24pwgvgmJVEgl+grosKtCdRKbqJtnjG4J8rl+Eqlg+XVVEaspodQpXZHYYUMT/Tw5nxf6XKOW8gaPx0lyBZiXNWGkeKP+cYhDPaLAmP2R1699OlyXQVehFrS9BolnWdQj0QYe+35hrghukJUDiBmOpzt53h/XYDzuFeffIQg6rUabBmyVdmAnN13GSmKpiW9qMWNVN3h4IvrFW8izL14jCq0hcvf4taqpG1yCmhn+YFoRCPTakJ19XJsYhCrkmarL7i2VRAh2dOl0/zkvQTJJ7HN6zWGBqy9cIuxCtBy7DJCsVR1RzPa03T63xGgX53OsUeYv9CG1SdNubVp2z588TydpgVWl52qKZdyfzJC9r2ybVxDL0nGFGfHGtBnWTxErg8JsnNiYOuZd+lKR5oV2KoC5Ct81pW9ZKQ3FVzmJJlTXUp7x4Xf0e+K+W3cQcQCS02tPr852RCkZam16zJLI9bWSBa/B3+bd5BISBf6loLwf7qHjPCLWypRoMo4F1xG11Xi7Dd8GlP2v0ztGcyH91983HGHDwNEPd9tsfat0d/6D/5zb2+gOmc9C7NO7ZH30MDDrATw3PIp+7mmjwj33shNM3rY9/fYzBB3derOSjGluoUpmEv8sD1VycH/ebHrPuvvrOoJ+sd93yS1/blW5mnCzyaO58F2dPHnb0RcX2K7cG/6xvO/0Nf56kco4sCS9d2jvfxXvOnvz9freleFoL0awucXEzPGOuaP85AKyqM+/juYEu7K2zJ5UnadlgrRCAT+ya1Rb++eziJnmC5q3TkbZfGLN/SuWTne74Hxi7/8flkfkP3ePxo/auEABxWs5oHOnd8/3HNafcbXPLH1W6dXZ+IntrPBgJAEFOTUZiFQAAEwAAFwAA8gAA4QAAjAAAA1ZQOExJFQAAL/JAOBDP5iqSJMXKpWOQcf5NPDHvi/m9PRuuI8lWlb7y3CEGQiBpEuPX3Rw3kqRIMbR7+DpjzqJzn3Gx4dy2bepZn23btlEprFPm76VKuvRJ5c62bTtKWf4RghZiSCGEHDrIIYJ0XXZAijs84B3/eMUjPvCLs3aYQRSVcahP2MZGt07kZ6PpE/PQaIZM0OjqhZw7+nYihg26gTbsWMZG6Svlk2iGwjIUUtySu0AYaKtMtuV7DvxGpk2jvXeUETV+GLpgaE40odL8jgwps/txfPQ89lcOuzPYwjb2cY9THL/f/xYK6AnfRJX5Z3wubzCJV3zhASd4xOXp+FRCgGtc4QnLGMUjnl7PYQxz+38lCXwDoYJUDWX19XyBBNQwwwcb1OfjU4ALXOMBL7jDC36w/7kN/AP2X5CsIATVXybEBIzp7/73j5Q0r2DpfZ9AECLIYIATJiigOR3ub3jHK+7whmc84B0Hz8cIvMjBEL+BEPPY9E9s2x33/wUMQQU9TBCO7UYGIVTYwz1e8YrxFHfkEvU3gTKGIayfdt7E4QQjpUogDi28UEENU407IVZxjyc8Y31p/iAFLZowt+VWDgd0GIQLRugRhKav6hQW2rqBCZxgE9vr0KuwiVkD/v3/3DZyg9umWLlVvMqBKTgBXMEIYQHaJTYB7+ZLUpa7r9C90r3RvZtX0mO6d6+56Xu9K7q+JT3utty7rT+HnBlM+YJ68tt3IvoPi7aVutFFa+OrJpMYBDSZ3/3/39AjD9D9HN11N91Jd9z+0KWDD995eEeg23jaubD3M/r5Dw8y/GDvtq9J6MLDHM0P+94PDjD8UAauPiK3y7XivxYKVo8tb1/ntp+5dAjJbnzvtl0euxyEiIe/9t+LA8cGE98TaTrafi6OzSpcmNEiCZcm3px8cs4J1Y3fb39nfnRhh98Qth+9SJf+d2F8OzH21Gjyaev78587Qhkh+NmvFkepZd9TptE7be/Rb+du14kpt+389tcLAgNPnXxyx23v097O13ZnJS/s3MZFfY3onkXj/SCMmpEL5GfbwHqeh7/28O7O3ned4Bzt/aj+OC6JibKSQZ8IWCeLGrJcCPJc2KH7v3/X12Z+VtK5nd/WHR/2BTSL7qws0bVEs6LQaQUS9w7reR7+Gl24tP9/95DgHt77cb0h/FAj6wKTE/Q6TSRff7N324Udoeu478LDAt/7n3XG3wq+6LFqAsrEyKHdXfvxDj1MxHP0l382Y3Zrn+sWHhkwJeq3Rbdsd9/u5Wq7n2/EY0Lkzk9/Ule83OMQgSII2sKP+Ses4ptfv+3JHbpPaMVlgRWkvR/W+ycKVU8dyH0UUd+eB/eKrbi4t7P7tV33NXL/W09MOYRMna6BlhB1zHaF9LOKZjzsiHbp69+sI67wOKQaoGshxMEVPOQqmnEfzw9RLaUUr+dR6qFoiAEqultwP6shhhyCDtNy/ZaYjIvuvG32zRHdW1f+J2Z6BCwQK8FFd82c+xo9+UTtcI5DCzRdP5XwBNgSd+eVX7hYN4mEL/A/ukEnEDJjo99y4qna5XmWhBvQdRHOTef2durI5m/zh5Bpo5/xZ+ESPmnzhd25+/o3aoURzwDNYCSzT9v49vs/dmo4spnwJcEUFCvFIZK7cLlO4K+T1ACEhJv/CuGef/3huhVZ9WU5zVQ6PYsQ35oHD1/49/rgBXzJjoFtcRx3FOO+/2ynZsF1HNbAwAe0eRzDiF/Ohc3k/qdmJdfNAmuwS/fUrOSGSSyhxC/rtXmVzyEHZvIDa7BLe3XB84VBulkgDf6N6PF65WwwI8hRwz34M/pFbVLewuE81BZ1FjGmZuCEIdzCxyGJssAE1nlzhg8vfLxWnhN0ESKVTdRWxLhmJqeAIVLUccTKbxuSQC0vfKz6BlP64mhm4eO9gryNGfloCWPWhY8Rn1IxOtUVM44OCm4gATl0U7YRoeYK7dwI+ht8yqGFjwHP2FdIYnS3J588IGqNDNXa4OSqg4XvnysotM3AeYjHMrXUj5RmEB4s26ECR6sxYMW+fWhpezRp+HOajgcvOoSztOI28AC13HQEr8X9rKyCgfJ0+Eq0BkilCUDBH4cxTl57aXBewxx78jmkBkhQDW6rAv11pHp8d4iG0pNK2fAeFd4vSiWIaSQDCTVjFMQcu2E89czQdahMUzT02TAn6Q/gs8lZXZqfVAZphC533FWCnDiTHEzMwFXHBmP1NBfGaXaqcO5UnsaB1CG0ntQFzdh6NHt81dJA/axqRK2sqNhh1m5JDO+HuNTZATMAohBFuPoU9YvIhbGQt3rPO7FHhEkZtS1jcvUc687FMNbDQ9ujqWpasJ4K55Qqr5kJzXWrOIzMNLUjEr/FoB/ZDWddRsNTTYuzEnpOIa2KEQk8PJzI5zyJUELDMQ49IRxaSlO+htaSrJT9PUnP+XiiJvrCNh7EJOmHzF9E43OeIq0leUfkLY1I7TMeN9vHBwT7fqaHCjOzgen737+opoWtvOTSjFKMhf0a8zjN9FyFmeyqfe6mEbW4s4oZJyiFwaP9UHW4qtKGXsI3cdvy7b4RpZLbnwUQH0yRhDnw0LmaRZP3ycdNdJHn1W/3rVOy+58dl6Go+IPKoQq6oZl+ekn9jtBobrQNnVVGKnErGEOlIwKZPou7qpEWxJmMu7GMToAg4dOe4gBd7agEPI6qps1G2RpppSyvfTAM+pkJj80uI10ndFg0VDyr1NOsdpFEQDo2BDZxpcALdEF/tzd91Vvx0uAmvTuC5T6SSAWJdbzNl4xW9WlN6SdWBsrcXBCnRQfBRQRq9yv7H29VF0kotKPlVap1f+/6sepILIyzEkkXSdyIQjV6aA9f8sShG5He5Xtt5UDihPrAM0xmaZIuEgNIAWXDtq51yiMDBto9VigpszJQTWtEaS47qzDDtmRkKJYxZqxA/nVDxbTgZFpIh53IQJUaGsvjmX8Sjp8Jte4pLdHnWpxXXUOooOSalnn7fzWn44RZjdiZOVLrtYFUEtsehzfaNUmhAEyMmjS5G2JoCZQKxJ5V1n7Z02MFQPabG6HaQGyTIegxgBQ5HW53lAsV/H5PLPmzREYmkkIRBypX0WaJq4dUuzMTqQHE4cWy3d8KtjQPQtKorPekEvOKkNOBqpaIAFG7PLWWyYhhP6SV8u2sRJKmcliJdLm9Obousqsz2CYyYzS5Jo1JcobzlqAINd6nz0K7mqEVT+TpdXvqwPMFGWjBlZde9Zhu96onbGVD+pQFntW4j/qi0EmXui2udWnB0HI4Ol+qY51EiOdWrcqc/BJ0Q6A0FmOw+6oTVqGeXCq1PGw3Uw6GjkUtPJFW69pJwH2zyvx8qYIT0P9KxLB+MwGgPrTTUD6umHzKUqapJ1pM1oDUeBui6happ3XyRBIjEQVZzRSw+sIQi1DmrahROW4cvcuyXJEK/F6xJ9QHUJ/AZUlYnUY0fMW+LfobYRfSbj28yodWPfO8rJ2th0ra/ung5fv26CaJAKYuIDIDoP78GkqjQE0G4kbvPWvXGEVi315LAvVLiBUbcVB9DTkh5j2WVX2fknECC4H4k+9MGkeBsuXKdPCSVSyWGXG3/gd4fgVRmbfWw8BXtxMdvvYIhrlQV9bqt4igO6OeQNStYHjKjUQrr7t18MJDSOzqX+PXJE7GyHXKIs9SlxDFzkUChc6tqVxA8hXPn3UC3exRWsfiNbrATjtLW3EUBjNq+EYtYf9lPHjhMWTz+j4k1Ig2DuYdfppEYWWXbwhulvfIP6NdGo/SPtIYlifRWsOzQ/7gpVgn2X9AKIP0QiqSNXOnlNOwZ8cbZoDRb0YW6vWDMGk5sRHbuMMQoYcilpwwzikcUOei5no8o6Q1o3RGGVHeLkpG1GlJBA6ow9P4ABuBwomzFp2MW1k+P6DUURdGcAcgF21+F2oISYUmfz3N8qKk+ZHVIvmpebUgdEAc5vgQy06q81nxDAtiOmgHaCcxvhxtGEk0Cq2CQc+KhA4ytMEAaQiS763SnkASBOXHBOtiWgE6n4pdxxk+BsiqAexxbHiPMCfaCoxMsYhKQVpqCyUfvBEbRiJXjzMusi7agRbKzSvEoZtVp2EVHpTAbCNDuTbK+/irtI0s7AthBlj+Zu4PMTIDa9jiOnx6k8lht/CNGLcTbGHuc2gDQ4CTCFezeglCtl42lzi0H8IMMUIMPB/jAB0iNPdbGfCvzYLmws9xoIkPV6Dmf1yJAyG+tUKOWldx6jz1x6c1HCi5v5p/JbKcfApGYPnIeRboK6hGb0jHq3/GoYEDKUJGd4hUUSBwQAXgyTlGhfOiEQ424pGBxDSQWRuoFxhXOgqwCpGbAitJMu2XtQEcQuHq7/PzMU9XAc2VLyRYBRQNhNuHiEMBDGlCDMS2jEPaQqB1D+H2FZK5KtgC8RjlPeHDrBZY/qwkjKP0Lwhg+NAWBHntXpdtcWTM85i3E3obPkLB6vEhb0TY4IFTABXkvTl1nTkvfmw5l3qELn155HuEGKItup/8ack9RbfnHFUY/WpaXPdccd4jbBzflWOPCDMITjfEvQpC14wTSt1GTkXZ4c6hvkBQSfzfpMs2kwCd9u/4LIcUSA0WcqeivW0ELnSRi11CrY0sJypcScQkVDp3ZtNtxJzxIC7R+Zfn39ADWCrsnHPKtijOuYYL1ohC5wSrHApcw8lbee4fcXz78+umHuEHFJH0kJI9uvmvkfSWt0pn3KQR2opOBR4KeuMbUHz75FCqaG6VvRaHawAfOyDxYeyiqwNNmw2/goiIcNW2PJHmKKEPDqW+gKAUfTOf3wXLgrMya4ZBwxk2zxniesh+o1Vwd+UM53AGhBKNlFWM4a5pU05Z6lwridepyVkRBhUURudjl9BGHqIJRhJ/Mhf0kKe4v2TexanfDaokq2p2GSUVciISmtjPfRzBJ8eSUk9nIGpwQu55t4BSMOFO6e2NpoVKh+iksLiTXfyFpI64APlNLDxZAM4wA8tmanzjn2IXtwp9UZAxqGBVSoauNH/9r1vveTHIzd8q3qyKbvXAGJcHcWFuVwAOhdCbbOLz4t2KqRnzo1RpO/t/s5b1AeurJbPrqAZTFLDowSCzbmo29CTPJ8KPDhY9GGzaHqS/TJjbU/TsXM42hKE+Rcw+zvgcvmSb22vNfA0+cg4xw/BhFyeEH2RUA4glY0BjgvRlW3idhdkLYPUQcVhH8JEKWay/RkE9cJpDOAMOfmBs+UFjMdoaFZc3cyUgGfeOLD9gP6sJiAIZPwD2U+hGuzNlg5JRTYLIExLsgpoCO2C31jVWG7Q8ySYQWb7f0NiyqWQEtUG74YmV2kyMLKs6z05tGGVYvhYiT5K8ZTt9etZyyZYmVBYksG88RI0zXft284N9yzzfhjYUxu4IgmCz68Cu6nDyCdvIzH6Adem5VHxLROZ9JFGDIYZyXrDO7BJRIFnH1rDoSYxbpOhAKl8kMp6v8MoXJRN7nQUe2Z+68seBFYtYIKtFoIwVFsecz6+UPeuD1He27TwUNgufnHi+JSNgsOgj5bnBUcxNt2SkKjvv5Nz8WxSPBn8zh8QoBO6F7N3atCdFR3GL0myzcKVMj1+e2UhCj7B4NzTF9YFCE4As+0boGprH3Lk1UYnvqlbQejsSpd8akIXrB6xqOxvJJqM8VonwidR1+4gmxL9YkEyAMt8JOLWdYdHtcx1Dniqsx6L9bfTufQHWq2rkfbZVn/EbNVlPykG282Su1DaD6ei9+3KyPJ5JjcJOtPxhi2GFMka4D5zeaK1HYaB5qg1fhWuiXQRkEGAPifYj+1inyLM04X6lIVAwpzVs7xmyLciSu+brBVvSJ4n0XDVrrz/fr04752jT8Up8bPOwnu3xCT2DnuRnhA0hihltJ8ip63otZVgeqSc1UJL0+e2wBAs9U1cAwtdLwl/a8VIQ871zd4t6Ka/HRvdw7jZ+UCBKQYzTFuvyGO0jS6Cki3+lw8CeThshzk7typOBqAYAwjdzdsBv5rDA0ME3jfQlAvtpDQzILDIrKMW3k0C32ejUpFgKZEUtIl+rBftjfbEuBGBv3ZJPYcJzxMXTaqIUKsBaygjjGh7+aahHVS1uE2xogga48H7PthIQyMSh2xI3G1xgdljAh+f+YQZ8makw6CytjV425Gu3qMPwAzkRmFJGfUaov0DsSaK4maWGlV/L+w5l4LftyqG0ATIpY8pAP0phGuktf7mPNQC2RUCGLySjf4ieqBNaL7lIMjF8hTJAu07eV4Ug67GuePzAhC9yB2T03IOmaH6dc6NRrTRx35uyRS+xBgHrbjkGZFB56VIgo2ASZUeitVigpEFACeqlTSeeKJXZImPXd2fmif7E8L29I3GNVlv9byrzLU+MQ4lPk2goPC8CRleaWO+A0rjOhCNy6pej1ON+WauRxBzc4OkSKh4x0D1+bF2q3y1Bu4XIX0LsXeLcnZ55GxvyM+nRNfD0IcgCicu5N3JQjJVZKky/gv3V5ojyvsmhlXTlUiWodxGsJXzxBaZXzWeN6lWZ0RYxOgkN5k5icJIxIGMgoE56NSdmVeWFgKiMFeaDoy5CEZh0qUR5FZ1mgquIUG5vn2XrYdwBpgRgZcuviXfuRpEpMwaq6hCabf6wbRHpOaExQEIsUeXOFIkvU3J+qS7v2k0pmANBIdXPrs8yUNdtEZEmKtouA8xjNqKqt5NHj4+IywFs9A0iq9DLhk8vgfrGl98Rm1meTsMKPfbn9+tAX/E9Mizz7W4qGBjwjww1FiFp4DPaaTOotFR4Z23eFd6sg26h+kT2p2UFZ0DWFX9F8RISWlSeypJQwUJp8pl6vTapOUE3yDKpPK7czdfNbxdlR7h7VPNGJRUuT5NI0UjFTT5br9cVlDnS/77pS5jv3/2Yqq1F4NY4GzJKRdpwLm7Oj7CWLcp76vled0TU0ufSU08+3FgZTavOECOLlTjnyFU/zWb7efV9LXyiqNRyMt7bv1G2itM5zy750zH/P2HU2VHGNPhz7qaosOTo3y+Ppr69tMFL6v76keKAlClW42RPf/ij6lY/dXs89U1mdW46y/vClfq/95vsSEV5NZ9GrJ14pDuiXF1ZHo4ns+qcXonpeDTYftZTF8VbLa4IXaD4/GaSPhYuk7KiH/s7XaOfleO/s7w9GL55JKM3DYkGtP3MlcXzwqVfHVfc4p42t9HuuCJL1+Xny3D/gKHrVOx3XeV9+4v7Bw79wUiz73P4YhdFlWONL278of2DilZUM7jZo5QPMlrdHvvVvMr79g8+Wl2av7eLc87RZMSxZoscDgBBTk1G0hQAAB8AABIAAMMAAPgAAIwAAANWUDhMuRQAAC/DAD4Q5+U6kuxGaXnpDhDBkX8EfHkPabiOJNlp+vDehaH889IXHiRGkSQpyj1msnL+I07SvZjg1ratqlq4u7u7hRB5A9oFMYOQFiiFQQF899jd3d1/lCL+Rwg6iCGBAArooIAAsjnXX/jCA17wgQe84wSd1t8rWF77FMRggLVP0Sg9Ma2L2A4J6d+Bau6usbgYVURKM9YuprYRc8go40O7anKL3ZCSomDkgX8cfAqEf8qoXkIUrNVFymvKgHKmfJaVUf70fKJEwoyMoOT+w2n/OHwWpD8o9DIX4g4bqMMI8xz7P7ziFpe4wRv+8Idj9HtVbSexFYOvlxQfyNS6tMMJC2TQo7sfexBBFGoIoIcNGqhbXaxi6f+LwHJIPmIEvB9RCuq/9G22IpfhBGe4xTPOsDDHHpThgQ4WuOEfbVX7i4jJS8sLsIVHXOEAa9jHnWaWYAarOMYhTk7r/o84nKgevxvIQY887LB97/MEveuVgBR0EEGOIkKf+3zDO25whXe84RaveMLa6/kJkfH/X20o4IX5dTxf0OAAN7jD8LrvoA0XjFAb8G//rbiRI4W6s97puFNZ1UJXzcaCGld5wJXS7KokdcAKk8Ioh5lRnnC0FKZ2Fp1ZDtoTTtwL/ueke8695xb8/D0R/YcF22rc5iFFsoRUxZsALen3VZvSb+/od67anv798jE9/3HL4wdnqqeXv215/OflxrU9vnZ+tgF+2u74uhH+ut39t88vth8/aPvw4rz1w0fPLi/OLk+/3+74DyP8beuH55vwqt3xj+590t//8jc/bE2cbnBx6hL71enF5fl/tyR+fI5N+Dsrvv/r04szPdU7LYlvXJzpuTX86a+3N8UGj7Ulvn5pz//Zr88vt51tm4pu3z671Dt87P/OL9VIwcXpP7RnRb/lmf73/O7lxTlwdoHTf2zp9/v/nG5iW6/a2rHf37mrF+cXuNzE/qmtO9kfXt597GwTu6utzaH6s/PLM2w47p7/V4vLOr+/1HNV/Zd//tlVC+Hoj3HkS9i5e9lKQs3R9dVyMQ8Vi+OTz3nA9///znfbh+PxJ/MOS4v1V9r3sXr8Bzp2mq+/2rI46bjR4kVtipcs4Uzr9sSLFx2CcC9JM90fRgFtyUlrxqmPkqLEZEPl+HAYeoo++m8/NajxeAvx3WRcAmoQgKJH3HWZFnOm5wad4o5+Xb/XXByT1GJCUmhCQip7uQDfvDRwQeixyzsN/0PxuFQrITWb9GWZwZenU9V/bSaea/EAi7+cmNHgpju+dakXuiXAUMAuzx5tJkyZIBw7UhmLi/z2juopYFSxVWF+1ei0vHTFoZktl9ge/cmP8aNf4Jc/b6b/dGBg6OpVYVb+uHbrklZm7WN1R2pW3Gp4xMzPSgEOgy1WLShhxgKvqrGR0Wb4ihEG94uAoSH9txnWRtifjeUI2gyGgBbkE9eyLYl3mflTV9+WOO4EGxxMx7cdAbQhPmH2SbMSEEX3Wq7YysD+dLxx7sAo3OK4tfB3ARUynb2Bw5ZThNechOYEEGQGdloLZr9aSPpVA0MDj28rvNGHeKMbRKby1VZYWqVM1wKjYItlW/lPGf7WyAjlIv+T263mxNtxq0nK3VwK5MYZXrVbzT152De1x9bjllJoCDgvaSm8JzBtWV64g/YSDj7giVsNblxrKXyGiGhi7szwy3YzQQwnnrjXrRvyTUFhcM+PWi1MJmMpklbrlL4iywdaknstzC9t3IuW8kdihQVQgOHeaSm8Qi7ewPBF0GqGxQU30CG0K7Zaza/yJWWOuq1mz3q1gQfFmCWtFr6j40nK1NAIn9pWdlEDqTxMW82c9anAHDMTEwl320p99xQibZJ485zdG6o48iplzjvBNvSksAQ36o/rJ8vFPNjSXI/Xf+dPygwMKVMeNkNhuWmb8gcEi9Un/IW35Exl1Ajx5iRwnDD3Cl/h/tTZN0rK3F10nGn+fC9hKGfSuAH96o2gI6F7/9xHviAsaVh/KfPFjA/jQbK/IfSiLjt5sToLBCj6DehX6YS5fjYqDdrO+suTiHHHUtU3lXgDyAPTttuAOUJ7OT/wNQPGWY/5my92xEc8GIIALlzV3xSCfgkXhSmnkflz3PBhH/Y4gAmf2oTJKXD85llI3HNd8FYzLISlAQwakL8UmvoxigXRY18DHaMG5P9tYDCVkus3JO7Iird5CJtTy1p+EUEUPyyrCgsa1j4nOCyl2qvTC+2NZjgq28C0e+LnfTB0mlq99BvOj5qAZ0hB5Ky5gy0rGqs3C3sD0HU8cDCU44QXKgI/amPOhPVnCTIfKqxNDV+7z0WAay01x98YX26wgZ+klW3KY+4Evik47JoWiGbYmWMPz1NGbkb5ADJ4h0FTLBBL0kN6eymwdqCgEAHG41s7Q5BYbveAvMt1sCvxVHIQC/uwMYagzwVEXBbDDIJ7NnilqaiNRALmFigYQbkphyM/QWC+2l5Du1WpI/nrBhkIs4kHY3O0xWtfR8pEYw+CcqdBgwQfB6lU7hLTRPiVZ3p6ctGwsZoFvZye+vprpFv1ETZryOyD5hT9mRDchFjSrUrv+eaNXH7U1zQVJTICUfvlvgiaNYC8a6qQPg4HBqgNBS0zJWRBRARPjMw0bN+CclNEhMwDUopo1j6hfj7wlIEHKQ62oUyiwGG3cTNz/sj4oj0POKRlZqYwCR9GlAbhZb56JuQmuoUcyJsXqq7MU+INyYyKk20R8qrUoRwDVkADVJCNw6CJk5j/yiw4E6uQpux44NA8h+p67uP4DRiASoUo9Zazyu9wN2cdS/icG/fok3dw/UbNH8tdpip4SbPXC7vboxLazevrlTlObZzMuS5PPld3g8TQBCBKQ1Y68MMsZ+2+Fi9cLZzGF4P56pONBYqQ0d1dHcCJpGJavqHGGFBI7FqRq7LLupFm/NUGmhP5k5CBQMyU2OUBvgAih9s2NKhracxJXVmGov7eZWG/U/VGG5IOj1vxIMkKk9JhLwq4xNfXDdek2hc08mZdR8bGw/6G13qX58OQadaf1tLYmwkw7PhZn6OTUZ9NOShcxCAARUpPb3Cjjkb3opSmpVIP7DPX9l42xSGiyaaaGsqiK6JASgUDsVcmVfNyItRqcpK4qJ+JMRo7o0cEAyFQ3KLKZV4C8vPcI7M36tctOfv9jp+hwpywaWqaqeFBR66byejd5DETmEaxqWHmxRoPxIX5R+HF1Ww84ZiUdLfIBYbmriUEmTQ+pC2Dj0hUkyTLgFg0cj5ITJVRiL2O2y1EnPQt+/jaLRl3PUzj5LaUKXH2Ile7kZ2FqRYKelYwF9JHv+Xhw2VlVa2WjAtfwSrEHr2BnOAjuF6fTgnpZFwZlZmzECc7BqCTPKiN5PwK2nNWiNjAgYNIpkIPhUa1mfS8gNwO4Wldy54LE5wZGE0Nw7pIa+sahKmoV3NMYTDZr0n3+um5l3wvHX30sCusUYADnfQQ3FOTwdjYvN8q8npLJuSZcoIL+ErXVeOVAaNUwUeSSAbal2wxBPaJtHiF1gD8KH3lCA6mt2du8gAFbIYXC07qUwZApSXDgoFTZHYbshHeL1WLT81N6WZTptTqkBMwZkYXur2hGZfKkZm8U4cyfdoLVgb+w03vwnRLM+bhw0wBkDZXX+ztZHKv0a1W3rUebFlcLrGxdKC4fz8Z9PdiRFuKVZP7i02LypEpZz/r2TVQuZLpuGqKSOsd3naYlEU6uPdWGLhYHKN+Oion/eoNEu8I/EsGIlNFXM7YXsjkSgf8CpSAEmf5ymqwm9gxlQwqx31G++9nBwdnuknph5Yr3hHQTt1Dci3lGdz0VCM2RT4gKTZzu+PJnB/VfIks4EkP7FusxLPxQWw9Y90w7g+S/XRfAQzjKKRPZuX642frkU+kLfNpu8/8E1lk5R2kuXF3T7hXTXGQxN06jB6AXDQJh0+XUIMQt+rHvDL95GDkJm/OppMyH3Yrz3gJM0enHm6PbuYO7gUYDQ9kFhXMkO91KrbPfVw+gwuAx5MIjexviv4mZcpfdMevNjRvlWWl4k2Q1QWKkcWFSbFJ8WGfAb3711Vap0N3bqJoMCfROIIwuse9PpJC3EjYzULzowoHnHqlnxJQiKy29kuJvmmtFsLBGPPFChWW1BVQy/NDRGB4qjxI1Mdja5mLVWFwTCYZyXtUoop4yX7I1KbpRD7/79JrleVEYxlA+NWXi31NenayTlbWwe5Kp2VT8OYbT8atfjn2DzX14NdUNg6eSjhhpjHmELGDxsY6+rEHAK46Q1DZXK98IvuGzEWnBhEZDgOiP/gA4KgzPK6SkkGnK1B+mUsOBlCIa5GEYOHiJmbGEyoQNLcIC9EJYZPsgFMj+0R1uS2+4HBxk8OqCi63iMfOgJXF4fs7y2n7pfNN69YOMHdZbuCJVYwTBBDZgtwASByKkGzAJXbgiWBSIbCFKI0Fm03/rARQwMk5Xw0W1yr56IjA1GcH4IzuFoa4ASco03w7OJbH1w8Kt29r1iH5OJQIdHAkXsB7XEXouQH8B9wzXFlS9mx7RVyVRWLhvoUEwH9Xj0CfUSFAI7J3lNl0sCalZWWQ1GrhUNBkwR1K+1YX+DCaPVjVLIWdQGCIcHn/Kgf3HCAP6MoeJsnKNqVkbRaG1ZTcPe7AfdU1PbZeR+btBXexLqKy5mxLtze0bc8EJbTI7z9AmhDS7P5cC9KkLZEVGv5TCd1v2Mjd7isboNKbEsxLLS43vNuYqk5n4+L+NOnHYddubNFbcW871XM6ow0+8WzP2qRSZNu5UE6gTzqT7CCoCAwqvXK65d3uV5QO4rAjI42TnKzew5P8Lk7gN9oazkoHqFnWKGL3YCCZSh/lMx0f8PtGsfbGwD5lW3uRyV0JWzekd1wJOAhnBtTGqQyreO+P4Ol9+yRtDyb3YLeKXxoND2DU9PDM8RBGhrWED2W434H7LPmgG0bxhiKodoNKfyX0aMlMezXXkQf5zHIuwLAQmM0AfPWZNkdvtKifpNlDeUFa93CRP5ilw17M3uRLn3XMqflv+/3jrdSflHaoEtiqVLNW0hyJeS7geTdls3w0Lp3lmyKlAzxf9l9HZPRGSOhqQg9GUvvjJ4lOcnpNzcGOcqbq3EpgtqEi9vyxpmzkLIyi7d9wgEuUXnVLbTKpGXh6Oiptk7QF4/2mu+bZb9joFx0OcqnMzzyXTDFVUXUgJyLMOCFNHNFp3vV4+DTyaLAX3K6bWx9J4kCymVolh0hNX0wcRD+BGmMslgk8jSo/1ywR2i+4KxjZTMEwKxUYRNkRXZvhF31/YzdzoZeo3VD2ZDklwSIgeJ/tYGBiYPFSb1Nauu7eg0nF+UoCPMz8cOTvy5HHY2DgZXK8gZl97N2QzMRdYfMauhurJW8WnwdLkMVeFUD521mVFz6da04dIYj4Y/k4qhzEh+X1wks6jqXdV2cIHEbdLU78/WyTz/MlgzKJtjsGCRln943UHNz3NojvNxR1Pu6nA6nJ6R19U+T3tCQ79uyhCpVD4XbgDPF+WGJ8gdTinYN/kwvuEJduKZ26/TWoK/xtDHVCt1mo5ACSd7NTMasEDgjhd5u0DxnPx7gCVNDQnvUi+TDRTQbeRP7jxmCWdiwB5GD29d2tGSCCvEnQkFu74MveS20pdfuAJzg3JzHFQeIgd1PTABPcrB+Y+k0AHiRRh8lT3ZQIRtJjHDCT12p5YJalNhX31hHdDC5byKCnBu9tQo5nEQeBT6vcym9FHL8o3yaEuu0L1e1l43KqM0oYF4fj0m1d68KrBu95Gg283iNw3qAr7CVpPsJYC82385yDeGSJm37+HE/4a6HEL5TQAS+qma0lmcU8rVsKOrB/dWSmD274nZoTj9Wrq7LvQtF3n9EcM8A+aduO78mno9Kvgzcd1q3RD8ScDRos7mNuq6QC8+6qkgygShliUh70/8zO3r03ZdStfgVeP2bKHp4ZKz7DmKHIkl4UdsmH7iV5CVp/VMms5ufMt/gzeuj9wgKyVwhE/cKoyB/UZBvpT2dKX6PDgNze91T0G1Q+Q5cKfD8A1gVfe2Q9WImcpi5eXM1OC/G49Ks9Vgdrg0fbcdpwtHUll4pVZevjs9Jn6WrjaqHYHCO6rZPykNkb5mlVLU8IOj1fb2o4Vlzh2eyZhtOZ5v2KNxp6JDAr9i0jVA1LHxTNHh7QUvN11f9SSFkRoFAI4WG/zF5EU4/fWt1azsBrJYCCrQKo+Mn8i4gfP168oNrFnD61F5DXMth4lcn8dlzB+it1+B9bBl6zFZhN+TdLZYdDJnbySPW7FVQgrWE2ysdEiURlCdABja0+fVU5fXXRIWIzL4mofBckzWi0orc8NKYcn7mqA72wwyVR/VWI7XhvYGwgZIe/OwG4P6zbhmcfML9Fxp0KT0BkJPJZ9LaWtJ6RK5nflqoL3gszqfD3ZCHjFxbdhvIMPmJIozpuAPi8DrdpgSfgPmaJ2ticV2fN5kbU4MDxYEz7onUdd95Gv4QPmE9f2qWR/fFUHXZUKOF4GQDN4qBD2Wr6n1UNJ9SpqrwSdrkg7aakEhyg7GrbD7y3tj8UmExLb/0lRj2ud+9lcrMnAM2TkP0hy3r+YCPnGIjf1ClrqdJemrtmASSF3zP2/e+7qiXdQ75Vus1UPxgpIpt5arhv3cBzYvAWedq/ZflN1BfWePNtEp2UUusIQLAp4DSbtL8pigcON5Rrtp+gH9NNI5zVk1pWjqG3Xh6FYHJsAHRV2amNge2f22uC2ysnXn3whzuLQL47BCNWfvxKVZvhbj2j9BRnOsjd9TLwMVdW33yzQRvSA0Hqr19iJnLc3FktRFnz43ca29I3yqEnFdxx0HUzQ13bWS3nCGB5JOd68oWG/cs6f0C/d5jZIhZRhZr2XacE3dy9vj4xaP1X13cb+S/G3JgziYclnOu4t0N9W9HRskNpcFhOXPp7TcI2/G8H10GHHXnkZ/ICGCWsPbPV6ClLXgDLRuRfNQRGWc/sT7k9+1ot0Ta1vZekGfb7cdjh92BvP7q5knb0X7pqR9o9tkesqW0ZOZm7xt501ap0tHZgX7DiYouy76yOX0v+vYbl8cnnX3LV2nS0i6fs4kjbhxQAQU5NRuQRAAAoAAARAACdAAD7AACMAAADVlA4TMwRAAAvncA+EI/lKpIkxcpjpifmWX0e3xfz7p4Nx5EkOUru7iFPPgk8whXMP63PQSRJipRzzHcGTsP7d8UMA7fatuXJHXd3d3f3BAbwXViCJTIAXXrcveJQUbm7a1T38h9haCGHEAroIYMAAsjmZpDiHvd4xx/+8YFHvOEPZ031Yywr4IYGkT6vBjFLhkfJ1DQ0eZCHhnwpeQ81yBl3Ed7ghhNW2DD1Wd7sF4Q/7/EBPBBCCDUMUEEDM8z37vKBW9ziFW+4xyv+cPyen2QnUN+jx+Pvd1ikhq74Umhp8oqxrBneFU1eMtUlRexo7i9Chu5eUqaOX59s3yeFhbJIDp+WJlQ0YaYOgevFeWo4/YMUP6QrQSMPIcjPuhzCu/idP584xwX2sbk2G+jABh8S0C718govlnGEM8wOz54sBVGQH/+dNh/vEUYAVTjgQ2J/HyRYRX+/OjB9aY8nOMAstv7z/xIj9/kNclBDj2GEw3IdR/q1df9QIQQ5+mF/ggTUCEAGDYzfPY0YYCELDWkDJsPx+IMMahhggRIzWHqOLzAJFfQwG/Bv/9xGkhtqdHNhg3Q7Mpq2R+Qoh7bVyllrt8O0u3vYszu8ZZOcXuc0rRwut6PShZHzWj3KupxmHeZPJAuhCg0+9m9VEf2HRts2VmsfIsqtXjlfeP8vgqY7P7joMnptffovHYbvnq+fl//oLnznhbXIf3YXTp9fy2l3xX84X8sL3+4ufLsBv9ph+w3OftxZeOn8ufV5h9U80+6/3l14tsXLnYU763Phf/v3zsLLberY6k9/8dMOwL82Kb/i1sGdPXf2s05olZ1avfPU2fr07NvB48fM67tPXdjxw7WcdgL+4fyMXRjUz9YtPS93uoB9Puew/+pZi/PTf+6GmlMHhg/iU13Q1lN3n5NvO8ZukJa+/9Tpv16Y8YPT8/VZE1/rJqbwTyA+d/5ql8Xzs592U/zJqf6TnYTvncHYVVr1U+fgJ7tLd2ji2c+7TO/i9Q8vOoxe5Tvy/zDaefDar3UVtpf9gRKJByd/sdM9uDSITKRO/qpbcC/IKY24oT/6U2pV9qWXeXPxcORCw89SqTovvfLaU6e8Pmc+3VQsIw293VSSONJohcUbr/zvt0/XZ+caPc93/3ejYzy+MS8rkWI26mkBzarutg9jDWlzef7lCGDc1nFDspAihddyLwb/dff8rCF47nNtcveFFzcR71OgtawpMZDIBJ7wWwj8z93nzg10xqf81Lf/cSPTPog3F6WFqikID6NEpLvnz52tT596+tWX39hga+f7oxZZE61hHzyta5gr/u9XfvkjSw+7uek7qtIBHMMkbPpmWy9F3cKtaBA4HuYGo+PqduVQCJPtsNFv8dBxJeIQYIOroPH3UYOkrNkpyCxixcugsWoxbVpx2xRxgw8FjZMWswVkT3ZI2mB4PWQMWr5eNHXCTtiPVNgH7qhIOKl0OB54b8DY4gYpqHPCYtrigYDxRIuROwTgUvBndhcebnGARvBtIRB8cb+pkRyLewPvZnsFAuPQxY9hs4lLd/AodC6gsEhbbAWO3arEQXaCZqDMCQZJ4NLHm6MG+4gj53GDQcg2JaDdI1D0GvQDxv1Y5C1OAsaTWPZ+BDSG0IWPDIFZi4cDxhLL3rMWq9CFjyMkew8a/RY5lr3fGzB+A1hHENhrL+tq0MIHcw/D3hNg/AoXv/e7rZ6KRNAM9K1QT0UgDtz2tQ31VMEwUOZ+2CxK8QiBPGpw0l166s0Wy9D11AzHojh8BnrY2Sxq1AV6aoxjUSpoFnV9CKzBCKQtroWua5WMYQLCw4D378HqWhy6rvUEVpu5BXSt7mICM9XqWv9nYQInLW6gTZqhG74KC0RYRDpCXwBSZWkDs1j8wtvheyEwTICDNnw93mK8wDCBwPWFR7B2/qNWIh+EfSbOkn5DBS6RD5BqqsxANxu47BFXCBwAmTds7q6f2UV+zZXhSEHIvLwVOP/MARxDErjMO2hRgA1GqvxwsLgG+af7Ro4Cl9u+BjhUK22wIKzBy/A9wkhr8MOhjx3CYAykysB5wByDvc3oZq9denQ5kKEMpP9Hq7+jxDciZjBMYpPtrfcshyoyU+/kL3+VtGaKSedAMvqI54HTThQvv0xYc4hA3bTFXtXU7UHkTv0PEOBX0O7qeubZovlwhKPBJ9H4StTgXU3NhlrlTiIIlYyzHNzHPM/GSc+QWX6RwmI4rTEYA7uX59ibFPpgQmloIcU0McwuuIJn7ipvgLV7+R1xPipq6zshIjf2DYVI9sk4F4Twrkdf/2fhXWeOUoNInupNfgz5tUyaGqQ3/UMe/VasMHZmmWnNDL+Ak9pyFG54VGZWke7NxbwQU2QTX2ZgfUAh83jmUHsdcLTIY5i55Py9KHDlaGXGn9wgt7DgRZlowfnK+RCHd7TY8qfDJdgowiJ7MGw74IORZqdGyx47/mpGSIgYw+/8viNvn+LSPPJnHVlpVmaSACv7VnwJMJBbJghblRrJPHL3J0k2ektvdztm2WLP/BAEwG1g/c7W9r0ib6Z8t7a1txUZTNKhw4v7LdXiZmX9QFx8X8tVf6CJrUI5LXDoNDwEYyJyeDcednyqlXXKhEY+pgWy5nwhChN7g9eH0MKPghTan0qfESgCL+SP/4QCf4nnUS6Pf2DCZ8DR8woRhadOqcaSP0c3eSqnKjqE89HoOJxwZsz1ktF4KpP9xKA2rchmT8UFVXiH5Rc+jb1kOTQJpun0ZgH6RBEuMv16lgThURjKiga5MlcP4CwT99KRoSQDArWx376Z0IWTiOSnLP6OpTkta8cHKrrI0hvlLvJ0XWW9iEqgexe4vpQIR+Aa32RMj12nwBxopaPcUVoXXeC6hMe7oZ66RwNJDLey0t5Ex7lNY00RP6xqZ76yyDWugg8fH8LHW9H0tYaDfxcYvI4rccJIKwX8ymXmEwyHZMd8QUXGPklwKIAk+jaNPe2WtZYTYdPnlsI2Z63YgtavaZTEqzBMF3iwvvtZA/sQAXUiBuyZe0eckphQJfIgDLMF/ndlDO9kqPkeAJjZBIG1KUXfKDNtOi9FNtKYFdGd9JeR1bovLBYp4B0VTce9S2fuvE/nBuiKObDfWT5fYdEP1yWovfb9J/u2l5RKa0pwLwaWHc8tcrsInIgIrt7aPnJodp/UBDbBV7xLx2HlhFRnXEQ7hTIYT8h4aVahpUtzmSWjsyZ1tCgrInAMGqU1lxQVElnkJq9oNbGmGlprHPiE/jdOWryFCp+jOSZXsEWH29SfWFI6tGDjYyJSZJP9NIkNPJ70mFmF3bj5bGB9Yngl3aBzhdl4V9nMup8iLYoJREu3Ya/C8pCr8mXMtSVuOsTJX1OaEaeuiamnShy7UZnA1K5UCyi/zdVxeZBoqpeDdniFyKuATlKjvOaAFKf31lJYjle9eDdJTWbxFeUqDRVuQLDK6za6/j1T91w+Mv2h4neNDwut8ZvjmDL0YSO4+lldVm64geAiUhcjU4nMiqquTFRONLskWdIr3MMs5gxxTe7fivAYiKPgUwGql1V9yCImM98NwG6NEAbnQg6RgzgyqF5W1govQgsntLZEcTZyMgbKBSZ/QW8Mj7dzXqP1hQB/p6D8cNs5MBZ/UN223fVUGdxExxXGuJYAo84FleaaN6jIUcTa8zRfi146KhbutyGi9UKamETjbyONFkXm8NjMbrVuNMlrwd6GpFSNfBU8YgzQyt2+6W+jd1FqWsLvR3CqCNXuttbToiJu4gvfWFjV6STXmTujcItqTs81cCB1NKuBcQFDpcUxLCV4BVIqCXjIzGruB/MeCEeVGKLK7LoNdro7lfh2yx00Avv+DX11pziviL+W+7yb2Km0nTgxmEvpcABOJITnQBDFdZkFsuKSfQWjjbpXIJiwg8FsToYdeBr7C/NJk8EpRg7GPGlpAbBNZAhLqtJr5ijFGiJhTj89P5o1dGufCE9oPjevoR5RmKpu18dS5gfjNFZGrZBwAolXKmLHyZRifG7HVZGNYrvWJZeJlOmZX9S5chsGIGLIVfkk7UVu9DDRwFu/aXXopLKJHkWKKXQ0iYhLWFLoW73SAH+sSs0qxw+QD/fNz6IXJ6NpxofCY8218xjFbD7fmAILmBOEs9Sk5ksyyvI5/J3229Sk0C08Et84gHDoQvggMbX7rmleWvpb0RxTS7zgNqo8Y+ZQLHy7lmzX0CckB4WLLj7X9Aak0OsDIg7jN5T12msxuTrjcV4JaiT+JTTGvjdFbB9GKfk7DLmpXRV3GPmx4WDZs+zOS54ocw5tM+1vEkTEuSLREzlKDDm8fA60ms3aOIETzV06bzFVdDnB455oE05jyXQ3WBM0RV9NgF5DgiHBmkjiDVYX4qwstMNGmoGEZoMf3VqSAXF987drSnSsPR6i51wXPbQN7I8iRQuU9GaitFV8Rcj4xxIpuSmobHkvmqcGTDQVhkaZVljb8Nc1N90m0LQHcbCoSqcUMS9qh2BAW1XyJhTCFkZOrnqMPVx4SGQh2YjCRNNXRYRKCycQy1fKvHSzd9kcag50KAhWEF5qJphqIzDVvSpUkAwtuF3v65x4I2rAuP+kpPx0Euz+g0PWKas3ALwLFFa6vllmEdJ0eK+CR4gPPd99ZqLjqymCSZfYARM8guuUaKYh8btxg6v7rK2HKbb9abkwe4tEfCJpd0oKGIcLLBHRMItC2tvZ3YTTRpFyMs8Z/etitwirHVzswXFBM2iy9o/MdWKlaOfNGu3B4qxHsPaHLUZSmfbizOOBljt1mPQhxvksydzwd0wijER52WrBlWLudqSQZ/Zc1Q+peZZGZo1Mpij34SeU3bwswpsAmWkj9qrbYq6Btggl7Qusl6EYwADGmkSfJz9Yc+TUUone+pFhXEJiMHzCMtRBKl9QmRtoC+aawgBtNcxHmolLSeuLLSvL+NR7HfElBYfdojUD8VN0pBsvkz1JhU1GORkb1C9BDj1lg5wrOF1efDUYW42+ouUqw4Oex6iy6ya3jeDbEC96zb7LlNtJmzMQNCVedcWfw5SkBT9gkdlez7hJxoelA3PCqFh/HCka476e+skU2WSUxJzsTbK8rMVpOPnyArefo+HbKCH1wtCQOPExHuBMIp5FDe8mRqyoew8cBRtsSCKs03CbQLkyfzobl+7DFnwtJk3Xnnj2Ii/xNofxIkjI1DDsCr1jQEgvfp21ET0Ke0s/BE6BCAiLw4hkVNNvDw3DuiWo35GHFJzpTbQIZ12GFrUZO1cJhoMBDuoBhosUn70/30s1HCzxdG/irRVxm4qFldy86PH+am/2jL0/TcV+SAfJoXLy7iPtNr15yRxIoWS0Uf5W+Rq+4avvk4PIPaIUmthLUnnJTPRREXT4kubN8JDzAJmnpjxxoopNCiKuXfJNw2B6UnxReRB9xTWIHsUliiYMMV/ys8hIVpFGEf0AR7Xb/MVaBz2rq54Wp+sRFkmWpPmicoE4vnTMLGBEoCZw0OOTESyiCnKkWjuCZWiBmMn+4ovkute//x6P6z1NqFBn0D40dcywjW63OcPs8ZW/hQcpPV8VJ/oQg6ISwUWRhcxGkV76vgtf+LiKSNejKBLjkJuFpcBSUoMlo4hL3a3CpA0IT0wWmdYquLD/CKD57F2tGKTo5oMROA5ja8Aus2Q4PXuoaHDMXGuztIujbJIq41Jq7/e/+CDx0GnhLLHY21IZjaeAeJQmscMyb97xHthATOchWexHRKT+8M8uNoI+HmvZmkoRtt27jQyX0//g5qz3/OuadzM/JpzHMfz8pf5AObdL/f/l6RYFkNmiIqiJTZ6Xq5cePhkMzafKsL/8qr9VYwkc15MKG0RSuwx2fWfr3kvMK+Ynt7d2NnWB7C9oIclxGYEjrEJcGPb6QJ+kZO7U7bUw/5sXIdIfR1rhzMgaWVy09MFHQ13GWaP9ohJnXTPoxde3BrqjCggXVr/CKAo8isjS0CXtz8oFVwYqpr0OiCLbQ/NE4FIryd4Z6xz7vReB06PKPL17N2GOlXEOQfi0szRyRvvSAp1A1x4dOGG4uugOuvdEWY9Y/c2FiHRJwbI/VICG3KwH3Ul0raWdkG5UAEFOTUY0EQAAJAAAEQAArgAA+gAAjAAAA1ZQOEwcEQAAL66APhD/4zqSbSVq3CH/WDad/Xd7AqThIJIkRcq7e2Z+/4bYBzPNuI4kW1X6+Xu4kxSZEhmf7pzjNrZtVdlfcHd3jWiAQgipi2YYQs/c3d0hIppG9UcMFqggQAMTNBCgWocjJc644oUfzhj0wx9I1rkX0R0aPQhCBzvssMK+DmZqHHDCHgc8Me07HWUUUHIWJUVG5ij/zrE1lrHDFRPk4YB7G84e2GGNDS4YotC1+iZqZVmA8hHJ2BpAFn4E4IUZhm00V8KIKRYoodg2RqBWljFGrigKREXfacAIfUywxxVDbNLk2Ih1pOuf5+VLuP04m3e+h4H8fbPfS3JVchYfwi2oyxG305lw/5OrIJwTpC+rQ7fIgW8kubjwzy/na8X7nOQ80b4r3p8/4kbbRbssuO6Tquj4PBPFm+qL6t/zjWD/vQivjvi9A2sDALuJ3MiNu7XX6ycnxL2t04O7ccW9kYo7FgTi1WqtgOYRTucgX3YV3W9HM6M3I/GSjxH9dwXZNhxdTAiRnbfwMt+3//9w99/X6x0/5Ekcj4enxgSB6Q/Gn/gPRwMTsO504jf0ToNm13/MYxjjK2OaIm+/4Sn8ZhBQZ8I0NNxGT3kJr/4qwAjPo7IoijJaprTUQz7CkMSiHIizeZSSqIcwCRDifLWvjziA/AwfztA7+J1BWJA1TMTOsD/yDXANyzo0rYCFl8q8FNRILYo3RhN0TGMfbXO1Dy6+CNGr/6BP8A3KP9sHNz/D2f6ppcwsuK3apjUG3imd8Hkum5gH/IGnT2vMwDrjVlC7nj/w5zrHXK6su0s9s/FfaM3ui6VnKIBRTasmIEGFMjxSssYCrAAFyrjLHyVrzCU5NjdeKXhiakR7SAtOvMFzI0wVMPILKhAhQcyiL3BPsIcpZVh6hTfoIUqv8CzSXAEDj2LhIdz07c9Nr/6Y/zU/sVc2u4Yq0sDIF7iOfjyKo/1qHYy9AY2fxMuY+CXxowwXHsJWBCyQue6NihCsCHmImC6PwtS4xxsJNdztFVzIgAUGd/oCn8sBO79gQuSeggh45meMUKeluMOf2GHZnFcQy1D6FpVfMNJC6hfMVzL4RQw+VECEVE5+QSTDzEOYehQDBczR4AS/oJJh4RUG/JlTBBDBLwz4Q/267ykVMPGHBqfGTsiA+wfhTQUc+UMlIgbY1CscbQ9hK8LWIPhFkmitHPf4g0XcX4ULECH3DYto5DyXX/DXGrEMtzzDIqJhCR5lYoY1ZiAns0NvAI2iiBTQ9wepgvX8crp14JdBH/+RYYngl2EJuQKGvsAXqLnZCulWr3AFE9L3e1PfNMJyT+tNBc6gxgJkSL1CZiMOcS7D1itk9gNGgaEtvEK3niDsNCirO33CcplcQ6p84gl8iMimGwqEYP8hv9QlpKy8IqY9J3V5k7LqEypbLpkb+oZs9SWp8oWpUQiRBMYEY68QVsK67B77vt8r2iYrRIrgldH5wvQWoecRmXIQrWXYhR4hVb4k82BkKE3nOtOHekfj0bB2o8kXJy0IutJ9joLu8enukHLjQT9gnTkdTr5WngcTgxBRp3B0asjVQY7JGn+mWXIuS1vo0pjhXj8QuOFLerKNSorvO9P3PzQIhO70CTk+QTk5aPDfoy4Q9OzaMDlb1i5OQj4yeE5B6OnMfTNXDjojLjhi3unzqMwtnWBelFHMZg1fUcj5BwiRd2Se0STASNFceO6sapdXMWvXQc4fRi4AfCpofcHpbx44Pu71jk9awb0BxmyzzlxOcgXFkomMBHgNPb+5QwkEVBPDId5/5/itU9TkGdP/1fhTbTxp8NrLNbg2IwA7psDg97IRCQlY1x+CCDcXzcY4Jt/oylBwyDN8Us0niberGLsOD4tEGzOw7h5hFrg6M/lWD8+TAOR1bAal4ehG5tgN7wcS0QaJWVgtA3fXf1TZzsCVrJ0mK0ORH4lknjRAFLrD6DWrxwaxzVbDQZ6Qc7rPkWiV09i7JGBcuozK2npINU8M0z4rilCCEnS8XbhHX5AfPVhmCxNXBWqnSAsdpbT5+IMap/TDVgcW1t85VzbAaVB4IgKzKACgqYWOQuJ1NHCBCb4HJVi7rgjp8kyTcYVUmoaS1rnIXZppWG1jkqmFhVZ6s7ErEh24GVdYibgBhOQKnNss8nhP2vmRNSwr8uyPXdI5/2w1MQMY8/pwnE4RGG9OVIDFf0oRC9nCoYJPDboIGToy5hCbQ1gCiE7pDJfRKWIKsIreJrhM4+hbc7Xme+OGwNx0qehDhTt/H1NVikB2VBpXnTID3fnGBoDdQuPBgRJvoiOVSHM9j+5T0/P9YsAINjhQ8qQIEGKVUzrD2RpJd87ZncaPG27AkE6hBgpyg7lHK9E5o1KnkncwvzVvhoIQiAqt3gtqnEPj7cepJd5iS26AQrZRaPMfIx2HBU0/Y5uPkaTjX+FCodYjvr+mOrKlEXkJc1BEnjJ7eNcInjLAs7bMT2onFOGN1cyWpUXdYeouRsxFrkAgow+qzGqhNDWObqv5oFrDZqO2ICTWy6bGhatoixoYU2vrdqGa+GNEfAR6fkaajyFZOq5jJh5prNlNlwmhYJ8dva9i0FD1FjB91Oidvns+wBy/+2txAICy5g6abFV+qyXjiO1Ky5+j5EC+jFGHJiwf7de0YKvyeuBKUwiJUVHHns10qCCwszRwdSMN+ZzAxIe7iTDJ0qZkCcIYz+WaMOVtVQ7EZMsvKYXZ6EWUvEDJtLoKahTCWMTFwmReFfW4kIKTBw609msQPwJ6yau1oHQCPOlPaqIHUqXcYxwVsFoBeeO3EYkM1SyeKkSJXJC8xIL0dI8mWgsIoIiZZ29xaRvZ3JsJZcKU9hjupPth2QNzlTn2X6YpTQVeLqKZBpacuarLQGk8y5FSZQBMD7UE0XS4pmYd6DqwzNq4sOB4YkstGcIRs1MxbCwaQ4Nz4maQUNA6U3e+kXlorqn5RCyigUjGrsFZA/HexOBMDXl0Zhbk7+SpnhD/TKW9l8ycjvE1dJMozpmtMhVyqKcyFFyDz83mUnFc7PQDwNZhIgWyKK3xax3CUEE0eGWkhhtjh9cfhSxPKVGfyQNEerYqn8WnIigDcC5cZ+28mYjB8SLVY/EY7n2igd8awudKh5uUIOlrmb4f6KFyopFghp9H+aoY8biKWihTCvyC5dol3dM0s8y1YOMRMO88iJNGa7TbkFJN7lsukpmGHjfONhuOOiFbGKzRINGujCV8BZOx1UrU/at0B8V6kxGAvQiaSW8QlspKRmek0uqLRyCBuD/AHCJkNqP32YWsABx1LbrJrgxSwajq+Uo3qDK9y2yfid8yErKGa82o+1zwr6xQtS7zuIhy0pJdkU55jWqvHOlGQYC9WysbwyEy0Rb9FemIqhsAqzx0fQfdQn0c+a6KooUho4w1s6sWkUWU3ltEZexKT5CcpgPJq0XCMrrDF5WNZbfogXqGqAY3NB1GHp05KFXfelOxzU+3EigqhAN3CWijoN9WcdiiqnrCNCEtRnYxi2ht3cD0B8UyDNzdkQa+Mli+aFv1towN3Yd1Cwz5XcYNyvQ0mUfTaHGxP2qGndHRl8zXG9tyZFfNQ6xBc/Yb5jsN9IIidXW2rq9gsaADOLRUqTEwybabflcuuY6vbWS4N2sxzTl2cu8qo6apHmNA29jaQjjDaw1TXjCTNzf/q1vY9xQKUlVq666UDQpZX3I7if/rRBtSBfhQye5Wuu0AKgRwH5zRMGbBdai8EvvVQ8g7DShTJpZnAFKT/QeDK+cEbDnxKVNCshgdDIqmuZ/MDooL2mJOAUjXKqKC+weDnHz7gumP8LkzreYip0HEfpnA6FmTbN8lpJ/bEDq1YW/pvhnC91rIIZu9HPRQABHOyDYZDhtW+LnAT40OC3ePDmwXsKOkVbZ3ABtOdhBWqhqYno55xg6A3sJwu1/UzsJPIQ7nOVjvgOMQY6j9Pl4aRoqkpqsPDwwQE358zckhA/PfDKwWCqOHpANgpXJxkTHsbVqsNQ87QEUOBcCNKzRxdTOhI5XVH2LzwOEUsZB9x4y6JUqMrG7+1TBHvamiWdwORJr52wvb2H/qiGx1PrJhLtUhIP8LjqA2KFcxgnunidIk0+kKoRvFox8oM75qpf29W+nLUVF3YAG2ZdxExCrFsRjy5z9TEsgs9okuRRZO01DA6uieRnpWPzrlKTOuKlH/N0n31GyqXHUJsDWodFMQV4C7YnOiN820U8Cyg+YYiHt+qnlSykhs53DBA8CKMafSOZUM3OJ3G2yb79YHwI1UUfH0DWrxoy7DLZQLnlcg0umR8icGO1QkaCrioGOAfNmg9wSbUDWZrhK9Oy7hxwY56EMyNGfMkFERwPSkSqWfGTBjvjqUXKAkgks9q3xBB0UwPUGK5wLuodL3M0OuuoOKHZHZGM/stF6LtJ4MZnipFBh31rnuNLVru9k0ALKrJGCGLTQOO7tTAb8nIe1aNnxHuFvsuX0W5/QRqgAaOlKlSXQDKi1JO9VFsZMM8nVDbGFIOGdnT62mWMHwC70wp+3td53LDtLoxmq9whuX54yep8qwMhjYoQzXtcaVk44JPQg//NghP6OXZF5dXl6W0/kF827WwmWb0bEMdMydZqBCaBP8vUNwm0mLfpISgO0EoAy0SMARDaT7deUOWtaiurhkagEa+iy87o/y8DdmggF9bEywtB3qUTn1HWuAIqlwDPcC7MiLU3l41BC2k7swxU/70DHmq2S1ziad788LXJuCe8R4p98wuYDppjvmsszuomWSpmkSR+XW6bxyo9XUjwJqB6jjDl2Z7Xbrfg8SrRpfqq8m0oQcrmMLpf/U2tf04MM00OK6PzXdolRbHz80VhuFWx76kkwGGahRq8nBL+NAjYs9Ruk5HHiY0ZZeAZ+0yrR0ilTUsywzJgrSgw6FIRICRXHRYYc8JSy3F8HOhdfFAXvGhIH/wJD0ul+EHB04oKS9qB4YOT0cZg2hUg3NNh5uweHWrm6b/yPKHB6mS5xrkBsIiw80IybEqrJV7wNmCs7ZIbeaGYfLFZw7USg6tNWhsgUxu8MWkuaquwtH9QLQMGrNot/iAMCHnITh7RbwTZ8Y9jgoUjWloRX3NjbR002AqyApbDXcfr27Ag6w4D6ro12rn8NOZiORplvIlwHdUWt42RChwQEAuGHOk3aNZbeiI2UbGHBvgBzktQsq+7z3dpt417SxCdhpVECG3gytkmAjxqrlI92wpnq1UvX7G2Tm+TqDjY7RGeDtQoze6cbnS4L0BuiOVjT1aHC7zjIFAOTTJJAVa8GgqjYBC1sy1iud5bAGkL5cBWt4ZfC7jnzyTL0MlIxKbllaWLmuAKjLx4a189qpj+/URqiVu3Bm3uE0t+DibH4ZnaesWmz0bnf+8lWfmmPR3HjOz+FL46i8VWwZFUdRRvM4NY2GpRWdmt4pLDQz4VbSqFQ0aRIjlxrTrHAcvtS9D0HoEy1gy4QpKzUx7l5Pq51qC35r4SzQcP3RBx39xKCyB06CbfqCuDkdf1J/sKfbXmcDYHc1/uz4+nh42rAp/lt8Hx8/3e1viTGTQEAFkDepXh466V2bjEe1++Ofer2TQ/gM0oCzP6cjE5bPHj0gf7ZdibGiwqrjA//GeqNlIgXLydduH7h7OyBublcgidO+f+KDL7wSdyFZyQw8GXvh4899fiqmI9k6Z9hoL7iHB0ybPd858IA1Q8IEb3wqk+tp4qqBKN3HkoBh+v3hjgfsVP2zqCQsd1HNee7JK+7olO/Ikzj+/vv6wyg89+QZ9/RE9JUc46X/nPkQivBfIZJyT15oTIchV4KNecw9eDTsG54a3X+0xHvupIfp0fHHh/VXVG8DQU5NRtIUAAAeAAASAADGAAD3AACMAAADVlA4TLoUAAAvxsA9ENflOJIkNUoxk18y4fx/MPOt5IbjSLLVpsXM0t1H5+H8g2EUuI1tW1XWd5cmkP7rISIi/65Arm3t2HN+27atGYMWXENmZiOZpwI1kAxt27atyNLoH0HooYQCOiigHIbyB++4xzt+8Il77KC5aM5J3GO76WIQgztrw5F8DSnqiK5JKJoIEoo1Im420jilLmPWdCU4aJKWtk4phpDsG5E3IUlY07UI60pbxJAS8j+LjSr+k4QVXRMTjoF6CbDW5I+U+oQySMnU1EHAamH7znkHHzbnL1EQsARAFMZo/1MUuRByiCCAEkZYMYx3HA59B/wQQAQZTFBABDXMsJVZeRcDRhcQAcs2xBC7QSCvSi2scMIKBzpC8gOZKX9IYYMHdrjQVJY5yQ5xAPIoWv//OAqhxiovFDjCKR7wi2ecYXzse5CDAR4YYYQXoaLIqqM9Io5v8qQAe9jELtaxd9neVmgxhtnP9+T1PUAGWlTDjNjxeh2hHy9YD+sG4lAjgMrves/jGQNRmPFfI/7rAGqggQx6WKCC8P7a3vGDd9yib768wSWu0WvANgCU20ZueGW9XrmMbSKJQF0IJsQKJ9yuBOzy5oGUu9xNJnHvvfA63btNuRe6e61zqtz3onMv1/TvgHmDmTcDfMaL6D8s2HbqVCdgKEW8Dy3JIWC/z5strzvaunCRu62j95+3uGxtPrKYi14pYr5cf+b1LY1LK9GrkcXx11sYR/Ulpdv1l9oWF+c9Q1m8uV2x7lnIpkXx/mUPI7hjvHtnshuFfc2Pctye0ORwN4dpJSyvjANNatsc7MoZsKwECoZ8jC82F+nwuz/+4eHmPyPKZyC1ApyFKl70EiL85sYZ80lj0wblWG1fU5A7nSIrEvzqxs0z/nl39seG4k0CZ2kgE5CoeIEAf/x5WeKbp2ePNxQLXTZLWV/B0r72p2d8+vOzm2XTPzQTx+gZ+KzBybFqRmzZ4Wd//vnZKf+cyxI/3ui6UIIEU+Tqi37LCn84OTst82mZT/6r0XX9rKwxV5H14aM3zm6eVlJW/7qpvWz0vRsjFRXmR6Z4+E9n/Iiaf/74U019rS/NNXU2mARWJx49Oav6rGpv/LjpA65IrTKDHCi4ZIa/nlUXxZ+XpZP/bLDx88UXKRiAJTiyMIRuPHZWDbXVi7SAVyCyMtulkbmf8Pcqd/wY3/hRo/MXhYKhbWYYm+Mvj90sS8rFvSW0s4ffnT3Wdaf/83DD8xdeqNoN1pmtqv9wwv/9v23hLxNoGdpaQU3HV+dqL9JeTwJ12G0rHKt6j+B4X7GtF//eUvjhAhkOBIiRh9BS2JBpRo7nd1oKr1P1gEJfC1qt5YdVndrn58/U4/lr2opLIjvPPFC5jLbSZOcnkPZVu7rV9A6Fhojg+Cd/efyJP/6Bf//b/+3+r2n4rFEvlgzA+hzB1EuoRPGgT248/uQfHv3l/zbL/gknBChb2z/70bP/P735CHN384z5sVKYf37KzfCjvyoU7FJoGaLWdjjFUlKVXcfMle9z8nBj7J8gp9AJCVd5gg+67ucdq3L6SBPYvtfMFYxJ9A6JAfSzx2+c/Pym2kz5S1ZNzx77u/94C+LEKHQqyOYjfvHb3//hb+qrKNKMg4WCEYF/AzystRyIXuWPj/NPT5rQ5IPqRe8KAaZX+q026bisSpjztmWUWs2M+xQacmcErbN20x9V9IDE/hm1mv4iGnKn4K1umv3T9vorgm7IPXCqm2P/ZISewVFLYY7oYibTx45yY+yffQo9bjeNeRgm4mFEa+m34lktAsTtpt+tzmqR+szthA+Ra7HVajxMIIHIZxatpR8QOCrFHkm76ZXa84REo/OtZoxGFDq11u04U8rAg1bT3Zys5xk+3/LzQcCY2mu5KQh7mSJ9qaXwkNr6Kon2do7xaOvSt9arUtbHm+8eOe45lEDGs268q9ms5qLraaRaz+Hk1OeEep6ul8XrPFuPskILCIQq6BQ/9Br6nunsn/2+qj0rCbVGr1DF+vNOQiESiiF3x0MC41j0rESsHiB1/RusX7fsWYv42MepQyF2KfQQaa/m/TH69+xmXZd3XZeMBkFN4Tm0Q24/h+axSfdp8mBPgk4kH4z1FYs3kuDt71HclhGww/lex8NL1wV3AnO9/Z7uCF3hWxR4kCpia6LhWf1bBBEZXgyAJ9rmy/dT/S92JJkO/sE3l6SLCzkx/UVnctzXXPRfaYtPao1RsCS9gwo+sUlrTbaQYppHmsJF2ykIOvsHLUp4tjf4gap3bH/fYpaGNIu3vthDPbM9m+Sd3tDMl4PkKY9wWhPYPzmQsUnP8q2X0WwirRNworYSNt7VVzU8DJn2jeHtU7Bxh5JnWYCKK+dTEDNVd7f7gxe/SPmFJwoIKvPQ8uQPVT0iOC/985mfJVT7kSYzwwSnY5vPt7gLyCIhLjQRzHXpogUPE9FNvi/9C4kJciBN5he3V6vG6B6BzvpY+9ZEJEBZRJ0tjPWIQBfqkPuud3pI8kYgKVPftM2GKEgIND1f9JGRCyRhej7sC8PLNB1dXFQ9C0xg+GYE8VRSFmOzqg3ZfBDcrX6qn3Ze4tYLpdz+bJ/mcXLatGPk9szJGMoiVXv5wO3rhUCXqcVHPn2LB7NqmmBpSgmQx6jvhYqHARRyPQ96dbL8kCdO55AUsIeMiHq9LUkmUsxl/mrHFABi90a06Y7aQeutyDOgWVNhI4s3OU2vxEv5aV9K1Kl30+nMkojrjr1gARJ+Pk7kgRlvE2Tn81BLVfV5EI3i0TAMhJZl8GCbi35KmEAK/X/tPerliSAnup1MgmGSS5iVwvz8dFhdadRx7PUe7ErQPyBLh0ihwfNDgmaBC8hYUwrjHNDGIM9XrNQc8z5u0+tQB0EGdKrTWthLpNn2c/zPmhaxnNUzcd0k6nXujbwjlMIJYUJLbug0XMN9CHVzk0MDvyFBr7F22jlKAwlkSFFjrWabIhwEmNndN/7pYJqidNFlepWgHn4hR6wpXm2UKRkstjVAtTGwDe2jFh2bq0/X0ZZUEqF33lKzkL6C7TAVZnjDH1O2JEZVPgxb4gBoLaH1Z4SG9C4T21GsXShnNi61dhpyfuSYf8VOD6n/KTqDSAgw8Qm0Fy7blHkRtrmsaUPGSFDMQECEsjUnyrqI5nsc7yC2QG1mRIh1GJiQUDWhWoSECRz0fYheef0cx/SRZN7TgcEArGnU12WQFH6Qho/14PX6OZAg02DH5G0JmoQaXUXjWUMWeX8HvTmBZsQKzM9r/1IwxmY7EyXY7/sxF7nCTg8pdRlJNgdkOkKZCtc9WeV931xTRedBCpNe8AHgucW7qxHZNit/3Gt8EHgSFPXqHiHzF2neMRbIdOaqTUY/kxIDILDf9sHXOqea6GLzeYQu4MZgzfmBtEVR1ozDempj80O3+ACahiRA1rdzmRUDNQ80voNFzzDjLA595GiOkSqIzoQWfxYJaMSNNBrMSnuRBb+xus8lvoxo4IKI6UrtPmiDmlHc5GnAMhn0rGT+Cu+nhblDQRVWyEWdC2iQJ3V99/meUcy7PN4JdIEMLtOLKMYsuKy+hN1sECT6n9+gAciaUhAlWS5BlTzZwenIuRrYlSd4AoIgVKt/pQY4AacaVqCqSXP9X7aUDjVYOsQPhb1lCmOa2aBQ790Aa3JR1UZCUwrj3OTjOsOc4Ma5KTQGez0CigmxCDBQPmTJmv9xV5aSieFQNpuEzqsesj4ENOJOLJEp/+IRcF2jw/JhJDQfxQSNx0bW+eSfXFMCt9q+VSEnoj320XuJJdT0UGSaS4qILYwKYM0SgGc6w78tesKK04aIaE7ravmgQt8RTHUU8lgW5iV13B66VtwTxid0hqbI2Bqqb1D3ADzWuNx5WWJbbrfv+PSmgvl6f0ioJpRUt3SoASu9D3COlb+mLcnJkeNOvo9jFW0eQsn2EAbGXqGZWdnOCsCWEUFcy+I/3AaxhCUODdW2CCkcukmoXqBmRg53VA1a9g61ppMXvNRdEAv6zQ/Z9IOfMdDNhTFwfRZJWasBWzM0onRC3UZoi7umCGbjCQX20VRkUZv7V6cgQZPt/wXCJdG0VBqm00PpTnTDZjxVP32YYwqyQqklQqJg5dgM2iMJmiAxv1MlwR015CuRZkhFhaVjpOAak1BNu9UlPTahkJW/qm2ET/VEl2AaUAZDDA9g34hCBquP96SS6zJx+/C+96pbObqG1lTol3PV+su+rsr0HPqh8MHKbUfCOaB81E9bGJiH6om6k6itzK6kpeS75YFD3Kp543mQxgj1hpNxBzAr26bxIAz6opTA8aYCt2vConxISeWZ6WbQjJK+Jk+iMPDna2a+oQxXAxXun5DHoabObggH3hsNAlOC6VWuqD4FQ5Q9aM5jy3eVahBN4rBvFVTk2M/xRWaxNVVVQLqje77wJy2x1+mNhJb+HXCy3auTINwZJ12axDuad8Z33PQlSMLcaYOfLTwjdPGpJfy0lx3Mo4lLzvq65g8yRDGZWhg1LbbHmay99MshigB3AUHbF8XetKLujG5KkrOB/vnjDKYmjB8O1d24GK7UZ3qDXdSrQc5H2mhBtGzT7O3uamH+N1V30SPEKgpdBpUD10YLjnJgtpkXdnP6GEVJ+PaAPGaUgbOwplTzzzKtWruJvkk9QiIQGXDISj5UaoXuozix99ouu2m8wjudeva0gQrJhWT9JSVSo7uI+D4XCEp4Nuz280LBoQRtDG2Y4AsxzffMNByIdLyMHkCOdNGnVKMJ8vu+1XDMEg1tWFSU5QCbbFHFWRIhdtJw6d8Dmmj9F+CJLDTrL8M9UK+ZlHD0MPEnTZHvyVDwHs5jOQU8DPsO/1Q3zBOB+txTOXCqIiSql+CkowOPcCinmGIKdDG0NY6nPXadYK3OAJfwSIoaSqMb1l4Ygepp33EyIZ/4BeChFhG90X594CTe/Ps9oVnX41MbpWi8ehqIvtpkfuTEQRh5BgbeDzvD750gDKhduvE6I7+gzv32NAMh8cPz0TNXbhBK/5T6EBtlZluMHZGWi55Q6GrfkAljDWzZ6fOZQzcrSrbmqqPjG6pjzSw/beV1dGb+Mlrci7fJir07iPDGFw4kccEBbN2jGRuBPesqtJoesDqcMA8dnPmOjvIMc9+AyD4XcLBE/wjvL4XMoEOmhn1cl3AzPYB6XbzO2ffxxx6iMwDNW2JAfcyafsaB+qsW0j+EEkgyG7FjW/Rb4EWZSkiJzCswB3VNwNRomIGS3G2IcrTQxuvJyz52iv4lKdjFFABntWQZoNYb4oWs3R3K6K466tvsLNnFf1kBZlkUhGkdxqStX48zZnrUHzrxC/s9HEl7aIoZx4G6os/Z9lPvwIu87yxAb3jt+DhgdXGJwgjASdhDbnvN0n7C5Un3vVsT1KP5XSNlTeS+C0UR/Dw9ZC4YN6mZYkEGhqvt9leaXEPX+occL9qbFrUAzpV1FwbWHowoN2b7Ns41w0RSprFvRmmMf8FpB3Utqv0PjLgauKtPqB/odYahKVmyL70TPA06yqddUYraRaqb5+2iuhDvAaVeabYn8V9AQ7j2o0yqkkaB6OljzOvGBkL9oZ7G5W9Cuqp504ogHHDI2pquP8oNR9zF60i3MWoGuJqiM5cdg3ki5HJdIMlf09U1JOU7qtaJMYPJQLuLwLGGfmlMkmh01dYYGo7FniA1f+aqnskGCUySQSB0L8fxQH1gs0ZiizIMfrs836jE8iAdR4qMu1zOEhN/FPCgcExKdw+V3KwKtMy1KEWJ5Bf1lMNQzffQeppj5bihpw5ZFldLg8vEEqXlxJaqDzWTjZUK0zyo7MYEaqaDaFmY18zxGWhuAvz5+1coNJS3QI3I2e5mA7v54aQ4ZLzJDjV1f3tDQLRZZNel09If1eblOTW2SzRbpjhgjfXlxetaF5AHmukv5Rloao4ek8ZDDpBZXGUna9Rvc2tWe0gPJDOINSvUXaxl6x80Gtpr4lCXX06+fZ9Li9TLSZeBcJW7j6Et3GULHGpl+QEHG2g0yCS1XzzleCeNb7jz1jwlaxwudnm2QIxV0zFh3L/YOF3MFjf+xHWMxZvd7i4zaHyGtF+zwYyzE/0Mmp1RaFD37nN38jz1zz9uNCaadaJbbjdSFAZPBuaGJbyXiQ+3pZE2GCAH6FW9uIeISI/mZT/27dvgxs2EutDVjzvW+UHPoHGz8g61d0b81ULNwUyTX3buHp/rodhMDY/YoJwPej59L+pK6Vhk0DRAsRcQZspZxx3gZgE4Fpolw57Ix7RjVlPyhKGL1BbVznC+4BMCuzvkcPiWAd7bRnnxBq++/Vol2gplyRPtTE9qNypY/A6g2+Jr4dXdhX5+3nMSuQX5QHR8YPX3BuOfJg10X8vg5U1iDYAdEBD9WAKTZuBMYV78/FLzr+AdqqfUqyhEh1bbsZyQfYjzkSYYQmx8vC0KVDWVQM7OKYW7galK44D+i1fIlyC5IGfgstCsMI9zg4srcL3XcaBr0QlP76zi/rmTIGxlk0rNljK7mYQZMxsPCFfiUGi5vA+eeyqv7nX07AxayqmtiNMc6gVteqyv6ebH3t86QdclxAlXat7Vw5iT7G6JJE+TeBzVnOs6sf5iI+7GdA9o/R24HhvsriK2w0ElIXfC9Lu5vcYH5r06DxTIKrd7lDJff/bce3ml0CRS57NmEV7X1UQG1desNj84b4I8RxP1SWmcQoqvFkth+/yPbb7fnDvX0yULZRHi8/6ti+ul4S5EYr46/kazbl1ljVM2s2FmrEJ83v+PFzbr1XIxR4fzBa/Wm+818O5bVjjtzYCiCBwZsluvO3rWViV8hL/gsblJ7FJoYDTq9p/bSrdzgmQkZ2CbNXOFF9rtNpfDA2D7b8ZpuTtLwq3GVh2A3Gm9e0a+qAuQ3i0L1kbc+ry95Pa5zsZMtAWztQWrdrsl76XWWI6v1S7XktdK51GTW042Qjv6D5NMapyWPB32tdPnrSfPWNbYMYN4N0m7pOMo6HW1ZETrVc57hmJIRrRbl2s7Y1lwm94HPc+tbrCkVeU1m6Uwcx4/18q3pr9aiE53blHdfExLy+u2Lm3WlRxvvqcY/e2BDkFOTUbEEwAAHAAAGgAAzwAA1wAAjAAAA1ZQOEysEwAAL8/ANRCH5CCSZLXqMIO3eI2beIDPeDZcR5KsNi1mhsScodPzlyQzletItk2rr/XMWF4cL/8/25bb2LZVZf+Pu7t7BpFlNEFRVEKsDZAT/Rh3d9co0ugPH9QwQQsBapighgjNPFRKbHDAFT88ccAN07J5gyTM0OS/oRGN+ACpps5EXBCAARpY4UQ5ihl1j/ybUFYhQ5fQZTHf9EcapRTRmzLJaPI3qoD0kVO2EX0d02cpn/xLlyaUWZ02//P7PejSkDQoeGU/Irgx5BGJgrFOKFqUz4jrb0u9BlRBQF11qYOE/N+giwLCgzGos92frOcJv8uI+AdEEBBfvN9X0EIHE3Qx3rfjE16E4EUIpdf7gS9+QrL4V/CVfbwfb7ighxlVLNE+thOIQYQODugRgxH6f7J4oQLpeTRABJn09z9iCymR8I/+IP24X3+44I8/RijCAC1sMEC3nMZ/KLBED02MsMQW+v//f9vWbj6xEyvRsRPffJFZ1Xfgew1Uh2gJ6CBCji0AZ7zfJKss3j149yKz947aInuwDf5mfL4g8AWo/hrR/wloH+cPr152r9r/L7x6dtw1oemGh+3nnv3V4+7lT+5COfWvj//+aHu42BsREXOCiNl95VH2iWMjImLkZGNEZPulR9fLrZFxm394XF1tjYiYPiaw1gamj8jFI+r/XIbS19goyYqyqqqqSGNrXHLxaLpopK+Nbyqu12uqa6JYBA55+jh6dpC+Nq24JtGXm81d5Gim8CcPD79zXl5upW+UYUMMSCw0OXr1v59eHHeHP22aw357/M9PnItLIz1tBuJ0AsDHTDXj0bNdI/3NYfv5q/l7uZeeNgUx/MdcKHLpydWxka4xDiPdcPvFmbsw4g6WIEa2SujHZSgiYuRUIyKy/+6M/dxO3CYuN8S4HzNT5KkHLw8iRkZs/mmuLgNx24LE+LVRLse7MDKqMSKH35+jpwdxBykIH7lQvjnaUXqa13GyzLKbbJlENjCKiBiR7fwcxW3+tFrDT+ZKONY74jQ2K8GeKG/iQOs2/zgvLw/ijm5XhC+l6chIv2ccUYEV0Zcky8S6RC7n5MKI0yxXhLesA+XJOAfRExADrtZ1al2ynY2rnbjtr6wJzsq/GC0jMexqXcUu+cZMPAvFvajXAD0qjfJjozSiZsTwK+bWIftZOIrb5muiS/qSSzdox/yqUWKMSGBTxw7ZTe/pQdxxTYAdb5koh1F2or7hCF0ydchuapfithmJLj2CVY6jNEpUjwUwN5psJ3W1E3dcbeD9Khf12RgvjZISo9csAk2OE3oWitOkJCb4WgnaMZ9ruQeoWQSaeT6Zo7jt7QoTZCbqr/tw6wPAXJPmYRpXe3EnIKZYGcX87GyAmSa7STwLxRncENOMRN22PhSegIkmlxO4FHdUEtOMRTXtuC+0nPQEsdY8eLcTp0lBTDMW/XKkNlRSX8AiUGTr2bNGnLYgpllHoh/asQ9KDF/AVDMvvDqKO6pXmObbQPSwHf2omNIfRIp8w6OHvTjNksQ0M3Gal+P9q+lI5g02uWZeePO0EWeQrwlOgNWfitP8TOtho0SgDwRAvKvIzpcLcUfVBrgHST/oIItAnMHPtz5uFXnrBwFsbgMlfOXHr4s7AUHAGzqIpbibh9bLLxolgZ8kyESRrQ9XB3GamzU8ZrdDllbcu9bXP1WCO3pCrMtAaR7GexaK83W5hlfo3oNIxW3eab39Y0Uy+AGATBQ5jnYp7mRF+EwAILm6DcTdPLQeh4qtvFA3uXYYayfOIF9jgmSdSM9d6/VOkdwfIlLkYpSrvxFnVG0wQfI2EHf46dbvrxglAn0BU203xo+H4rwGMUEikZ771vuDIoVHRaAcRrgU95KYIt9YcYefbv3/Q20B+oI6UsyLwbbiDPIVJkgspee32kk2ipT+MFXkcqCrgzijcoPR2WE/3lpxh59qp/kvWkp6UxhlN8yzUJwJiNHZIdmDdSJus20nGyq28qeOlP0gR3GajIQHUHvwbSDuP/2TdrpbRXJvgGuleRhgJ05bbuAtQSrEUtzmnXbKXwqVBegLMyX81ElXB3FGNeEtSagsrbgPv9tOe68EpT+5Yp6f8iwUZwLCOyKTnsd26t8zHcn8KYKOXJxwKe6M8J9VJO7D77bTb5QY9OXOKsd+W3EGBeE9WRhxH9s53Cmm9Aaxsu21F2dUEd4Tibj/9u/aWfya6UjmDRdiRGTX4+EgzgQEPSNLK05zbOcyVK5BXxLp9vgvjTgzEr4Tqbibh3Y2D4qtJvLsl0U3+Qb+l1bcu3ZGj4rceoJTLsUZ3BL+Z+IOP9XO6b+HSkZOYCtOWxL+L8R9aGf2T5XFFPbijCrCd5ZW3Md2bndKBO+u/kacCQjfmRtxhq/a2T0qtvJl4fj7UJwZMS5JauyxFPehneF/DztSbHDvAREr2y81ogcF4QVVrYzEfWxnuVFywkciUsJQ9KgifNCh50aczUM7ZxnpxYdWcb8LYvyTUnH/VjvXe2VJeHF3wnJF+NiLdSzO8FU721slBr3IpXe2IugDSKhkacXdHMKwaQ67438+mZ3PmU5U+ZH1MfmaJIYnQIeTzI0M22y/MC/PFesHFj2CX1nTOQzVfsRSRgy3XzpLrCNXcLumVyRuXsvI29kpPahZWkdwu4YDPpJlYmV8887ZARPRbbkG3eMReSSeHs5OLLotVyBAEiDGJjIrJ9vXyTLL8jzPlpHtJeHVnFSjsYpEtxVBgMrYxI2V/kGSlxXYE7jLF9Yl5uUcfM4TVpHoUUUQBEGczFPI3EpvE+c1dfQl8Z51iPnEDGylG2MkVpHoUU0QQ5/CMpLeUVaTJE4DQGSBJuEM7JVkJNaR6BGIEfsRS+lrkhKE3uEJAOtYk/30DkrKUYhY9KgmPGVupafNavRVeArIVJPj5EIlI0YkE9GjmvCTSKRndAvCQzLV5MnEvmCUYpxE9BiEnyytuOOSJLwkY20/sa10TTnKUvQEhJ/MjTjtG5LwlXWgyNNpHRRbjcBM9CUJTzNxZyB8Zq59a1qhssBwrF5r6YrwNBNnVBJ+E1Yxk/qaUW6I4UqrpCuCXjATZ0rCd+aKXExpJ2o5BqLOckXQCxaiB7ck/K+NcphSo0TVCOBbK5KSAMjxWAaardaT4LViJvQ9o6QYt35bggBIeBiLGmEFgvQvU2RCe1Hf5zgg0SVAjsRcVFsTBCeAt9rTyXwxVCKM1XcsVlYJyjUITuJOu5zMVtSMmElmomZrABOpjXKcTKiYci5YRUpMdkBiMr81lT8ySoLZKKRrijWcnMxxKgdRC2IuMiUiz9UXrRJVs0CAdaRkG0z4TtTLiWxFzYjpkyRYBp3gjhPiW+3ZRBoluJsLspBujEnl2pNp/EDUBaZPx3saMTrHSBTTTnOvFZweOiAzZeEBQA6FQDlMJFQ+W81IOgZP6bInQJAEmIm6ncYPRM0wk51sBJ5CbkjUZZ4uk8UijuNFkuUVSKs9ncZeMSVnAj3iQXqTa6K8WUY2MNLf2DgRtWmn2Sgx5gPMldcYkxuiSGNrjIx6OY1/M0pGzMhd0AkKDnS/WrPKYmtk9LCd5lG6QTUriMWIyGIzyGrN22UUiJfmxTT2Sow5AVLp2ponkXibvDbirXkxiVBJOSssTEey9Qkrlqk10tdoJkrSLNezhbU9xLycwAuj5MS8XivBr/7PHmSdRUZONlFalBXYF/igyiOHNBP4ulbODN+ajthirZFlYuXUIEpvK9ANnV2UkSY7/3bStdXMgJkiJsUGIG9jIyfaJK9AFQNyRSaaPPXuoFxjdpAoIlEO3sVG+tvktqKKoe/JVaztvWuUlJhb1rEmYqNAettlUYMkMTJrq8gT30Ilnx+wjhz9TVJUJInx78E32taz/6oVc8T63dPivAJJ+MpYCT270m5nCCSyoJdNS5DwmaUiF369NMqbOQLAO+uyaQUSvkfKN/z6acVWc5WJHhUVCP+ZKY1fL+btVvQEJDGFUjGPBlaRtiSJiZqOPH0sIBP1mgQJTsIqF48EVlaJQAAgOQFGyqVXPz1jyKRrig0UTJGxcvTqL8PZYh0rMTGlyL/jX0vXzFIZKNlGm6j17bIRZzlHhXRtxRm49OWykZ6zlCsRMelAeebH84P0vp0fMlP+dFqlqE98uPqGkf75HKViRCSZFFPFtB4eQzk1xXytJxUpzXi/eJCey18znes5yqS74BDselGL+pujHX9J3H96u4LtRBXnBsyVuMMTSBL9SXIQptqTsb4p7rgAgUjEiClnqFAiEBxteKM07bi/fRCnyUACTDpSzFAZdIK7zWkAyT7kZr1ZrzebzYY6UNc1+KeiXo50EGdcrggAzJUM81PHHfnvGwxOHaiq94ubm5use1PcVSAJ3ohq2nH34sxAQilt5xqcGzBT7Icb3J9GbjZkVeZZ8t8ia21gjDGimsDaOMmrXzXacZy96PaWhJORGCNRPUOlIosN0X+1Wq+J25sktoGRwY0NRDXtqN8UPaqInnwTiEiO+SUWiqTrVQ+uiSpfxjYQXy9H2Yqe1ERvlmmSY45ZBookWBMgN0SZJZE1MrQxRsSccGjH/LToCYi+BAhwlsBck+gGK6LMlpEVz8OrUUItIXE2mWoi0btJFMjgxkbxdaJfx9b0se2YW1EjEGcEiWNoGyXpTX5bVuhd3eXZwmqyHeFLRiuJ87ocLIiTrKjAoVGlmhlhK2pKnFciswPYeJmXH5DckMTAZKLIxXBGCepzAzDrZ2ySFiXYxbisjbIb7DuiZji/pXWZzybZ+xVIEj4yUcLBvqmY6uywjkR/97asuFqvSfj6VpEnQ4XKAuc3Ez3FZrNaoT/Hqo3ydKCXRsl5blgGWrYiTh8NVvmJgT4n6t35yURNCAAk+40/zlax9blhHSkWLvpUB8rTgb6pLHBuWYiaESoJr2SURsl4djLF1g7P32hPBgqV/OwgUWJikpnWDmzOE+tYyYYgQICjMFbCcYqzU9mOKQagc5Ra1N3jZIP7QUCMyfe0i8cFIiUbAB0C5AiR9mSc/Oww6chig/v7IcDuULwT9dAOHSjZ+XlPseAJPBHgILF2MdifKgl5XsA3isnXGAZddk/jW1HDdvCd8hpnB3FHIq5w3wsgQeiDEFY7DndUgurcgO8pkq5xMtGT6MfOQtSwHf7/KXJ3furPKpKt+pEYl5noPzXCJ4ySnx0w1yQFe3AsFqIf2jEbZUmeHUSaXN+RGrtjbO4CzbwcZa+8xtkBS6uJXRYgSfQlOQBLK/plO+pRkZL392cGfBtoIkF8U2Gz7m42GxJ1WYKnsLSib9tx/1XLVji/fGMdIvL6Or25ff/992+L/CZbRNYmOJGlFf3Qjh0qMXh+wDLq0TVBYIy437IX80D0P/vz0faKqc4RWC+DXqf+j36ZOJuHdvTvmo5k5BkCWSyCwdIerBbibB5aD0MlwlkCiCKJzBAmLh1kEYnzb/+u9XGnyN2ZAoiqyOIoCPrY66yoobNOjTgPv9t6+VVtebYAkqjK2zxL0yTopAChkkUs7l3ra6OYimcLALlerzckk8416rpDVqkRpzm23h4Vyc5az7QTlKhrkFVmxd38U+uxUYKa5+3+/h5A3pEMNXiXWen5jW+3Pu8Uyc6cylKxNcrUSs/wM63fXzZKUHE65GzUtiOL1Erf3Vda3/eKpJPiTAALpf/hD1r/f2gUU3Eq7IKchfyk5l/aSe4VWTwGYPs1x/9op/lDo8gd/SMdmEkWQQ9z+KOHdrI7LYLvRFmRAAknp0UWVnTT7L7WTvnLRpH36BerhY2y1Qp9ySkRmRF9//2HduJbLajoFWIRkXS17jNpVok4d+0Mhopckx7xbdCRBGsHCdAjnlJE4ty2c3jUJPeqsorEJelQ/ek6WKfiNO+08/hnWlDRHzDTxOZkL3rCLlSyiMUZfrqdyb8wisSgR1hqIkm9IUBAoS/QySoz4jz8Xjubv65JSnoDInVIVHBD4H7lEYB7ACTy1+LetXO61yQjvQGZGU1kUXK9ur9fkfB5RRSxuMPPtLP6o0aTYuMPwNw6xKTVar1a4f7eG25Y5bH03P+wndl/NFpQrTwC7yKHiM3K1Xq98oQkyiySnuFn2vl9R5PXFT0C68Q4ROyywGq94mgkUeWLQHqab3y7neOdJlFNjwDkgUtEovT9D9gdil1URWKl9+EP2pk+aBKDHn38Md7GxmFERKLlzd0HPBEAdVRFtrDSvzm2s/27oSbXoD/4+CN+aB09oyTL368+ADQSH5RlWWRJZI2c2BzbOf+U0eS6pj8f8eNrGdbYKI6XWZZl6XKZxDYwMmBz/I923p8bTaKKvnwEJjJVc/ijdv7fcchnS9IPcCl6c9yHJ5kxTLP7ansWL40mQUH6kYgevmrbV9tD2G940+x/8L/ac/ncaCLLiuOxjkUPX7Xqq8tvNGYUEzb77Rfas/oidEhUkOOQZSS6edH2fXHcN6ExJxkTNofd11+15/dTjUMkrUgXTyNvrejhp9qTr168c/yN7W5/0Pfb4/99/qo91w8Hl9gc5EBktRRn+Mn2sbtziUQFSOJk8oPcirP5+/bxexm6ROIc3LCrkUSZvRb34Xfbx/CrQw+RKCsq0F2VeWLEbbbtY/kY9hCRIM5yNUsjI33DT7eP51d702dos/9R+6h+fjAjNf/cPrqf78MRwm37KH+1bcwgptl+qX20P981QT9jmv0P2kf+L1xu903YbQ7bz71oH6VBTk1GVhMAABEAAB8AAPkAAMEAAIwAAANWUDhMPRMAAC/5QDAQf+a4kSRFisWBhTv7zv8fM9+sG44jSU6klJaZHLjX+e8bk1aQY9tWFa3nuOZByCTGmKlDe78Ht9q2Zc2Nu9NB5VbJAPTOBnSwgENc1kiVLqVngFTu7u4eXKKrUx826KCACjrIIYR8tc6keMcXauijhTa+Ucd9mP+AE/phLj84jkug+SXCGJnmQpgSzkx/dkpqhPWff/5hPCLtf0oYEsWDedrTbYPwrvRjoCvnxO6HJk6J1aCKP3zKThWmpOabJk4Zh4z8QVgH4oL+UciXQAyFLi/JMbD4ZPtuPOKJzfVMXQSQKGn84S91RYgv1NFHH7dIwQA1FOtl3UUN73jEB2ro4RojMS4kqDYNFv8soSNmYt2ADUKoYIYGdqigW81LNe7wgmu8Yj30hTZHqpjAdFdPZbjGE87xhG8crJYVCMMCNyyw53auQ1DoiIOSB3UIGzjF8lLUqVQVsIhLPOENV4aDAF9YwRKuceM7mzy9LiAEByKf92ggi8C/DpvIvW6fr/jAB36xgyUc/NL3DH6xd75X4IUaBujgL+mzi1fUUMMXPvGPo29CkzrIwFzX0QrV76zp73OA4j+8e1BDBTGkWEUdNXzjAaeP1y+IQAEFjFDnfJzFrgH//n9uGzfCFiXKug8SwwLlBAwZmDAkywTuuAAJXV0XpmfveJ3pnemFTO9hult6d1V6pXxl79wLmbr6m4CZATDzHfF+/H4j+u+Ktm24OY+SEM3Q4fGQfB/9P1FuyuXW9csVm9PxaFgIjqfvumJ9cuV8xCy5sH//xGfWIv84E9aUrRi/bv1xyciqLKOXrTnOMKuOjF+7zni5zDsN8qhBW7Y8MltffGBk8c7xgjhJc6HeXsfbYrKNXrGumPHebvWKvNSjhAgRKWw6wptZ7Mx64oPC2r0sKZE0w25T8k6bayy0ozSpIIi77jpzNw+xEL+KRyIaJD5bX+4Uvy6WUF5MyBe5jjZ4F7fsVfZElMWCG55bN0w52nXooegm64Yxn5LVgCiNbCHPWqIzSOq5QFh10zoiyJKars27+RqGyOWDm9cKE2RKSEM+eOYaolMbIo/jP9YQfn3SkHHu1DrhHcqgba62ODOLp/740ONPPPlb4BqUzxWk5B1GRvHd5YpyWdx9zxO/NZseX8hJk/jO6mCRy2GRdNudYOkogNImx4ZJ3L1aHBIt6ADxcLW8+94fmYvPMTWJe1eISzrkky6s8OBnYEnrkoW2eQl/vJtoseSSlnSAtPrq12FtJgNrJ1zDqY+m/eX98FePfrVYURRxsFjRzyHxdhl1HRKf8YSBf/i/eeirYoToNlAaFPKkyjhtprbz5G185ADpq18Dw0V1EF4UMTZCi8PC3f0DWA2fOwX1N/SEooyVxxerAzwE5K5kltDWjfU3zlqmQ7/56nLBOxiclDX5HoMQPbI8PLhQbACC0xwuh7oFo+Wh5QXOPQqBj3A0lHjCbQHDHRe9sHwCgk2Lw1OEYQX9+LavIt6Gd1SLHuISAfBvok1LiZhVSfzxwRIPubrxV7/xdMke3bY8uIAIQJM6wRusQjUpXcco3fGh5UEuXNV4Rbd9uaTqmF8LWi5+pZsPyax5SppEjKov/GlV+Jxc8sgjUr53WDj9wUySU13teGyMzrAoyiUSqgmru78nXbU6LIJfa2bI0c7U4Blm5PhVkYXLekh0gEtp7fAri+Wh/uA9KlOIXBPL+u3jjz2wLP4/MY88JNmd/+aCBzQ3h/D6k5K1hJFtaOX4/ofuXtIBotz9tgiW9JBOrmIcrTRRmHNsptZ0wLvFL8U9+Z/VIuc2nfyTJVSTFKWYbMD+8W2cO3zgPrGqvCyCu3+okZHSrWNH0tht5soHi1WyT9e3dC++jM8dKC11ZG494b94jeoXAt9cHS7zRTNCco033D9UOPqquMi9fFVzOgsyNVzP7+SVRrcJrA5Q9pOy4BP0hm6aqJEGx9t0tjlddskGbhLNZ7lMJ7mMR+VycUwTmn7iUxuXVBzHcdtqKbNxfHW10FhneAnfB6GjJPyrNLS0qE9XnN7Iz3BxaocOQ7QUCkMcTeZfLD+O3z/+Y9np5/ilHt7PK8yOkrAnhqPzaj5Vpzfm+adpNGRoaRZG0/fUOLrbCx78T51qIwapkpACJb3RTpyez4qRR8wCJaN/qswfOB3qIZ2jCNy+Eo9/6dbqjHbVyY359GJ+oqEKvaQiv1tdOFwsH9K4DYvUhOl1VfuinThdDC/TWB4rxEYmk6qHQK+pyMEiR+M6T81bUGyXp5/YmE/GQ3Un1kZ03EbTa/sYhNilKKYeUUIVGth7cXcvRL/pOsjke35JVQ4Xv9BXop0okm1ZKTflvyLTMSs/qRarcJ5tB12v7XfCKO4llGJWLJWIsAYrCVHc8RxLIhsV+H3Ogzp4+ZDnelWVQ/HDvjmdDOt/rBy30fI7IcYlp5J0CDeMxa7h/lDoU/hT9e81spS2cZNw2OXffial+GBdbHXC3agnOdEEQDCLGuJBlutUf+Q0ye/ryuQkCkBEatb8dDlbrueHUazkRGvKLg7lGJfy8PIAF99S7ueWquYAxCwJ227lbW2nKG+3KC8jREygymBH7Nle6eUu1byQCbpTv/73e9d3WbW8DjW8zq7k40XABXdYteDb31r+78FPFPNq4cex1a93qpAiv8EqfanIawfdXll54J1fdfjOQ//3Yz29ydGtlwkpaDoVvlYXW/6O+FdBJglSA8gYlpmlxJrju+XfKy/PW1KeWW4PxsClM8K3ZafeqfPKvlluOzrL/3wmZsYIyYUwWu0VjMevVUIaMemaa3diLd8reG8FoQVOojphzQ+1fEy0JA1NdiGA/q5TSQkq6gdu+8a47CNmMhGfEUAmJ+rXdEjXtYIo4dOOCWKm26z0asb/K4aZCl2Z2/4YIdLOmA/bg+TYlTTUvTCXZDqG8Tlm2ngLk5gtj2G2NRc0ETWI49jHtl4N6sVMNN4dx7T1GlE/MDR3HerXvnCP6U1BoUSgHqu2K1Ro09T0Lthz9VaU3izYM8yq3yBWAFGhE/cR6Vr+wzLVvM2NqUEgFLLkoubJBt4gtvFCPK2qI8oPHAfRloV6Sx7zk/TEqUEe9fiy3cJskPhiQ/9Yl3+joEJk8L5GpK7aLFul9GLutMS1ODqvN91JQIUosF+2I5lEBrkoLRtRuuOYxKHvSdubx6/W5d/N73oArIYki/cHXPtY3KUbwqBD+RIFRIgYU088mf2BIGmtr18vpijs+K3nlhgymYUzrSNe+RAa+7n0cZBEQavhIHJW6DLDtCMRt+GVSXO7wYlbyBZxO2cjMoQ1D+QXhkJFAWDJ+ZrQc5gFW4ZaW/2Q15fjfpIiAvPkOxaCj33piLQ3hHh9cCAGemOsilTpmPRuzS37H+aPZKe/jykoh/G1FlhhiMPJdP5FKMPB3CQFBob8Wiaa7Rsetdo+FqUI0sF2q9kgl7b430zEqqHDz+Ocy7+NJ9PZxz565gogPTxfPRZmX8MElg8kp892W0FUV13sxRHRXhgQibrg8IVXXIK8XHn1TUQwJ4P6NH+Iuxm0pkjRu36s6mcLeek6ljnd8z/Bn5izKcRmKUTnOvW/1hi7QjcrA5iAbAnBBu+3ezq+tlnMRyfwOTfkCIGFHaGyrUkbHQR8cDl4TkvGPoISR/R6OyDMagJocDdIe8OWvvpHtsPMmNFxxpXaAhZuyWYv1BqwS8zI2YGlLUd1WxmOjTkT/nyRewkzgPaGVqp/z+fgtwRo10CXO5SuVgIjpvy6jBUvbpzC29ohvTAOI8ryUljY3NYQdO4JcDYsZDyA6kjEONLEoAWtI8JaYEDMAfHiG8AVsyE89oUsTq/CgSCqowV+s0smXBVW0igAh2aF6RFUW6wQG7D1iPMbRawEBIMv2gY1uX3KIpsfHQGUTfEuRrIFII7THUsrXyhAqFh1HMOMnRlbWA0wG2+VKY+oeLmX7TK4Ka+YyspxUA6QDUgYL8jCLOlpyNQT04fnYG9le1G7oCkBCUbEEftwSlcq80nWtqCWem4ijd2YpL4EIjBODND2z6bZgBATUhn3Lajh5lDivZ0UE+JoJMCQDSBzm35YY9AUVogRJi2wt9OZSWIXuRhhyBXJVeggbZJ1WdkAKp8rrv6wMcSdhgV13VRyFq5PBqk4B4vQLgDpJQsbVUeQtTphNyGx3wKWSi/0xAs1hhv3enyMCDkN1e2lCaQAfbuOKc52qdFs+UHYjUlaTjfwm7K+F+NXQeNZ4i9qkKKsYtNrN1qyBhEYvqXIGmk7iK4oW1gyjv2VUG9F6EapvEaHJecZEZJ3fdzWY7+eQrwVISL/jarwsYLlfTEWJn2keOc6z7VrmaF5a21Z3wt4mdSMF+A9iF6/2E4GEm05CoN202Wmxum9jgojDiKcNn4M+lhWQaS4m2/quY5dfQ4XG4WOZUDfy95NE40onfbATzHZp2rV45iibhj4QmcFThrkUdsP4pB3z4DGF5mFle/sAdJ4S3W6dyEvfZT/cWM/l0HahLk4t8SmKYTtu3xbRiyL13iXMukTEYY1OpBC6HeVwh+7pO/wpHrs8IUQTTgszMDjSXrnqwpLOxlvQ0z4HBNGwJmRwno6Dg8RodrxUBgPBR0kt4pBC1H9l/STwEo1JSV2Kgw4Q+PhG4B8+EQc21IQiQxnLMwqCJ4ehyuNKwfi6n81BKJryrKobkxFmH00RsbgYiFCm5oGzm7x/XKOZdKm7HdMxwiwQWHaYLnuCPLOwgYQWHxROkCuQa5gCrLnVcuABT4j+n0tL3iW3+lNkM0hngGkzxdmrewn+4h9xcuZb0FcprlACp8eExpeBv3cVfFYbw5ymJXjzzGJ1mxIXQndeEB5qLTNRagm/fXfQeNSDic2YJGEQejo+HGaCaY8FVpFL8EW1Oa/81xRLDSBvmQUhdPw9+KSc1wD0Y7HQHYvnphSFKU7jZL5+bxOVDKR137lkj0LwfbJmXE062YBatCyHc/f+4skzaifS1VtuetaCLcv/YeZYN2ATqv6xKNuMwijs3nWAZUVg0hRW7xM7ziCyE1CM1hqimeuaM5iciNm0883jc8mcuUqlE0RPAHdf76Vwk5tSzqBhEnUrmzMsp0tt9nyETuI2CpMPtA9zS34LYAYWDzNiP8Yhe2GMkMm8PEyn2fgF7EnGLR8WVsuRZ2mqypp9FLwj8bgQcYXLHliZwhZUqvh2HUZzj5wlAN70YlS4K2e6A/S/QqWPIrDTmHFZNVjHzwqEaAWvTZY+nx6Q2LCLEnqDwgLK7bf9hpyK64pY18nFTIDG97Pa39hjdow8jN8YBJHIQZUbI3kGsIbK9zjAxGgcSOuEStrDcX+gFIkvilgBp7zI47thEAGGNn8QaXV2rmrtwlhYMoDSCCvwdyQQp77sp1WrAlX9fuUhjbX4gefD/GLLdD4PIj14Xck2zUFmogFgwexiqOKhMY8bsebhO5SkGklZdS02xOhzzE3gH8YaQlQHUKWEo81jwZNuuXjP4kBXNXRJjlEqGZn//rvTeC8EMSKgwGp2c1tQUspX4co/rNWL2t8RMdUgLSDSjbCtkRr7peCiFjvKk3N4FVjSzLaG1HdxAOsmaTqZq7Zy5J9VAWGzKjbGL/eQkSlQ3+xGAujani4J9RH+iQDEWuA1JB3MzVCl5DMO5gqos1P19dV8MmJbEschbQvSazl0LcMu7/pm5lkk32lf5PohNxZQ6rj2hbvksF+IsSpBj3hlj21LJdge5lvp6i42ovsBdyQm33EiitQ8q1BiiV7hTVAyW2aDHvYQKWdjmUnEt3dNMN9RKwEFvWe+BrhcxmkmRip7ndtnd3odd9kGdkNCp1oeWFelA76VVORkCQTjGGTkkyevXwviziMddru2hanKp20BT+jFKvq/1KHzTBJM6x+dXwLxZnIzOJ9I0t9o79nSaThx0lWxSafU/zyRDJDpuvfkFRKxQFv7TT0MTtexizJHx+pLRyR8Wbp3Rq/G9SWmnEarTBOsWwwYLLbYrImT/Pks5ZihyErN03xA12rbNpLymYaZW6j1QmjWHy7UHozOPYsM59RTK3DyK52S0rGDXQNu3GPKy7LhVOcKPFdVuEejg3avtYjl8mMm8MXHRnJW0eiS1KF/l/+eSI5hyg7m9xAV78T8veVTWI6m+y9wFUxKuy9R4bKK4biD2V9h6Ete6bQ09NhrWGenGwhoktYG2DPI6vl9pSyShDWmja1ZAj+TRuToeydhLsk67hx9qtNf1RYSU2gTkzyZJl/87ey3g8bs7GtdWbgyZsKtel4cMyvXvfB+HkWYrX76jxnYz4Z2UxD2nAy/+Lx8oC4jSitogwjUsex6v3+P/sS7hmSFS0wpPFs/vlj4zGbL5X9UnhRhR5ztONKfg9eXmvvb73izOb847N3cI9JIIiDkomgR8Uc0B8pngXheJGbxlJtOIjlldnIl+m/k7eqPpxbbrqarszl6uPtUarnrETJDcIol51AugbZfG097rU4gVO5ciTNtr5kc1Sz48zRepP5SB5KgyGn2q67yJhV0vBmHzpai3IJjofyIkfveOf5o/Up5zZnU3oHEc1w/rm1sYYAAEFOTUaeFQAAEgAAEwAA9gAA8gAAjAAAA1ZQOEyGFQAAL/aAPBAn5qq2bVWZ155LADpAV/LRgC93uDUcN5KkSLHMYM/9zptzf/m4HUeyrSp978Nd1uyJi2iJx993yLWtHXvOb9u2/5hT28k8FaSUv4B0kJFbsG3btqOU5R+V0EMIKUSQLfPmD3Lc4h7v+McbZrqxB/UwTNPsCcNlDMqn0PaFaZiTf2cQghLlrpsEV1jCC/6wh8zjaGZDMi7/E2A5Bmokj9cX+CCEEibYYYLtvLzecY07vOEfr7jDxutqqCZqGtRfgKaUTFQTNY3o9p6Z/A0+RaWrkpIvaIeeHCvatjANM8KUjJ/CnBfe9US0Zx7w+1fGJgmx5NMHfl/6YkZKl/RVJRc7xmrBt+uI7Y+Sj3TllT6Zk2PHmAZ/lTV5c3he2T8QjIQUvxiJkc1VdvbtUokjnOIA5xhbxgMogAZuhJEHbdcsy+I/CTkwj5tflCrRVcIb/ylo25UMFpgRRBQRlMJ4ivsNpjCGF5x/rqbr9ppALhTQwYc4Is/nvxFZsMF2/yx/0fv7VpCPEKTQw4jA6zNO4hFf6AvZkvdrov4+oAUS6GCAEQoIIIJsyO1hC33HpQHdcECwqZ/vuMAJrjCDnt3tcYlNHGIEe1g1YBsA2m3rNoziKJFSA234BChLMbPpSlmqZXb3VURJlIWFp77H4LHBIVHvSWbvHdbxkvcSsxO5zJ7eZoYa/THi3gvg4ALox3Mi+g8LtpWw0UOrRuNmbdoiIPH77P9F9O1f0W+rGI/M5vS731Qwjp6dzZ/lb1cuvjV79vhkTj+rXDzx+LPHc3r2tHoL99AzJzw/eqhycf+cZsviT6q3r2XFMyfzn1dwcQme31O9uG/+zDGfHD1cwcX/PWaefa+Ci/MlTk4ruBjjmQru9DuzZQVXMF/MR3FCP6tePLZE1k63XzcdN4g2G7SYTL92dYni6V/++mcZ8N1ZXHj8yfRYXTSNmooMvuHW7ZLEH47nRPd8MzUeOjqJw3fTYq1RS0PNycdKEafzYz6hDKzQqVD8RTpsjeP26TKf/mI5flnOjmf0+FNp8eeT9BVbjVoG2nxzCb48Ozs+mR3PU3+AHo6LJ6k6vStTJDKmpYc/zubHPMsS7qHjGafqdFyTUXfcnkfE7n5dmVm8UnoM/1Ec4qrvpcO9QsXPkzGtSTh/XQAcxQRh4DmqA42tsgsPH81nxzHNvp92sn9CKQofb0ktvBCYQ5FgWRW4isy731V24cHTuQD+3Wk6luFoRo8mX8xEiv0oTCBgvtRWZMuvs19J2ZSMw0PffjAFS9gUvzAPRmEKgtCTD47LL/xsJgUsWcZtNQEOhOkI+pYUpuUXvjs7kcIjKBjXjCXMw2iQNgRSMNZLUIJztAwz5jmKEGerIWAzhJS5kIeBVZpt+KHlX+STZcAQ0e62BLjCOakr66V5iB+8Z34yO+FlOM2Mz9ViGH4WMHjSvGC7HKdDdMI0Q1A8fVbs+TAb2BHDF85KNJxkDhOhvBEsgXCouVOK4WfzZ4Us/RQDVgDZwB0xWT0rRfrpbBl4Nv9FNtwkjKMdZgPDRVOcC5WlKuLo2Tll1qaLfTmQFaFY/Q//WJLh4Xvmz1KCvi01S9xZxozBVXZcjl08/9w3s2GvJcDNjr4lzQiqgq4R0YuygrktoLVXFfgrU4AH2SEVV6oCnyIigTkcZC5eqoudVgUmAsxDyI5ArJhUBcYiTxwggGxJmlcRuKlmSFxSdnIkvrgisBDQjoHEMbSuqQZsN0XmUE4RZr3GWjVgTxJuoOCiWTonPvfA0en//eyn334oD7yhLsCLMNCvlw1b/OizMc1pdkT3nP75h8jdfaoWw7wQA6Mro1xw9OxsSSdzEv4Kz47uue8HTz+Iyy5YAZQy5jHNWHXqnI+PTv+IeaYdljJOl7UKOhG6Oz5hOn4aA2/aFNCBsIzxp3vmYjPVgWPmIxy71q9J010k1MsGzD/+2c9PH5CbEbF48AgDU2kChIO+iNXyWY/xo5/+4p6jGc8levYFvJnARgADxI5eU1aLUb7905+f8j1HRDhWrQ0B7RDnxTdLUQP3EDEGvqrgDVHgluYUCLMmQgF3KmTCu5BVEjjYFCX0lTLtw0GVSHV+X5OktTg1B9LErxLKkokQaktjvQLwiZZsLINDTnW0nIj3jYdUDqpDG7PVSHE2hiHFtAJwuyEqG5EiO9UhwRtLPBJauTJqvtKS7QhQEFVImcQB9CLc8noltKa49QCQyvXK4IjfLqYuVmuXKoM1XPaMyRkORPFdc7v88aKiZxz0xHRSGdMAEy21RW3jbtWmnlEZDPFCrh8g1VdGz28xEtTKWKZw46rtheqVkX6wJlAXKYadyujlzhbuTPc/zcqw/xtLswCs1KmMyc9bDOQpn1GjimAMG9IquwiVHabVypjoOkj6NpbOWZR/fOkfUKXT0YFZGX9igTvRDZfHdOSQ3rb1ru2dPd5dp7WVVebpZyfM4yUtRGoIxHzz+LOfX9/RBR8QozVAO6aHdvWqd+3IYzudjOPxfHeTW8wGUS0zGc3F5FN7GuAuUdtm+IA39cnpnK0dvuYv19eE4eXFcnSzja2RmhRXyuPbtjRhFdohqgSLFmi30q58HzWoyS0z2z20PB+ZGm/PF+83ZPNtLAYpO1/4zp2/WV9ZndJEvJWMbHdQPOvKi4QLXrycIz7WxD3HM9LyhW/auWb9itXpp5dj/J7sQ5zHCCuuODnDH8xT2SbzhajHJtK3xO76mng/baYZY/RxNcisk8VsE7WdJXWIuuQye0vyZeq5HduqG8rMJC+8w5AkWLg9tj64Mok/O81W4huPeS8Jg2vTftvpxIPa83y60A+YByEzyBQpabQkZoZw0Pc7lqEIN+eDj743n2NGK8Ug1xDIFO4ie9/pUNft+dQPOGRWjyqIlP09Z+bQ7yj8kIzzPGZhHbPS3U8It9KmE99J3sGhMMCK4U0c20HWEVZfJTFEEHTNHP1SvFVxbIAp08j8qanLQ+z2/OUID+LhikZE8giHetCAI/alg8Z6LgIsTFHORTPzIAtDLNxM4mdGMcC60qgvhQa+AAuZG3bTjbJlK+6nyymGeECsMYHC9pJoJR8BluGhSeTVo8z2cpTjQU74kgiLRuCKnS/y4YYdwELYrRPZjtv7jwvB5ZAh7RgXqSksX+08ql8yZNE03r8XHPZDhK+KYsXIN8ROcp3dY5yQPMhQcIhCBwE35yStLHOCDr4QtSGyCgejsNQReYZYgS7K6QxLLcWclF2BhrubCvdzJY/QQpYxTRWqtrLHQAJ2GkDZ5yGQgJy6JRchO4YcXRIPr1RGCsinta6pjHpA5hcWSPGvm0pbqGroa4Jr5eiE5U+RSwJejatO9qW0vE8aQLART3jReOI7ynEWAChzZ5CtObANRcrtixKYQ8h6uSAda12Lg22xtRUUGGjylMyXG/kGbvr7ArNIIJY0uRWBPbOGO9tdaN4zjphdkz/YqSHLqb8sLawLCwbFKKcDMKP/D4OeVcPWSnxG0XPhkPGikN+2vmvXRMLUOSrWoWh+R+n31SqpIIGDg45drxF6nj9hlM80INPXjFLhChwGvtv5V0ut7Pv7f0FfPOqXljRHrVsW34agfxjr051YoZ5sPvJWdImlrX/r65OV4yPiJJKuihQk6zgC5ksXfPJ6XYc3bWujbqbV5rZiqTx22dU8DmOKbxDu04HPzMQpiNTXch33XOZux9m3yeI6kYmgqW9++kt5eJXsa9560Pe6zqY8cJnIFAjFPiy5/fg2wby4RMrLI14n/vRrRmq0GpNP4hsBXisqV7vA2uYOHaumLRmtZmM8/fpenuvCtT0bAsdMvj90GGVqNRc8nnxqfW9HA8+pes7jQHy8iyYDzI14iKffuGJlnfa2dTHTPx9qCQg7qQyFlGSLxElUX5LiSseT5QjHA7yz/bYznejqpqJX0HAy65ACsdXBwWGfKLgcpqTLgYKIyDUl/IW+LkQVrCGwdn1sqh5b5gUhcDQUCVDoYl2Wz2jtArseaNhyyOdlaz+3n8sciGRrUq29uVg61g67UnT6aW7fEli+uBAt1kE/DA8M0djKBU41gUdd3PVpPSH60nSRgbpuxehFkOO1OxqvaaOmAC/S1C6NqDuShMu5HlrR2Be0rxsUZmk2DMPrOefE0HNJ9hvqMYxD/SDZ6xyOco0cxSachp7FNSOG2devxhHS/RDCXKXQoiKN6FUa4nWGZESgqbmOOwoZ8gzAVlzUsuIbuWmfkB7vYfaXZUgZAIkJh/0YWq7KJl3hm0Lry8NQ5oBzEkZHjqbYnbRkaKYzhJ7SQFqhZUrbnIuHtXGrRvpoJCDMCs4H0NYPb1xtCOIVTQV40Etwtpw+QJi5C7B1w7um8WRUZ3jJ/w7kNJ0WTiONsPruGmkOP83vcS4BQr2e97TWqJH26Ncl3W2+8SMgcIe6sEl7C6XIdLNj6Adg1byvq0QudgMRCTXGlVqc1VLlLDfkes0QpRugVYChI8AKINfIbMXQw3/nWJVz/ACk24EHS+hTx3w9ja5LYYWTAwbgG7rUbKn6PH8gfMpFbAS6vVw/jIvSWs0cs2Dr4idpRxEtTx5eO0ZdP8DIlf7BMMotkHzpk/xjU5b1dwfA8sxU+LLqR9oumSA7iCAhMl48lJzIvD73WjlaB0NQMTQxzCVAN43y8DpDks27AYyGpOKe0aL021v7rCbaJiInSFhy5IhS1bwAnGkBpnJPE/1QMI5APMqjAyk2t7UQxKcTzvouoR0B7HdCEYjq1r7jxr9YI6Kh0GpAlPr/IeIIXKOmiXT+/emj+DlHB2DENEpW07LbHbd3IdZHDdPP/4Vr6dkqK6+8ITXqarCmDpDVjWkXlpOwsPyS4OVCYRwkmnpx7NaiRqRLj5+u6aNHBkYSOto4PhMsFoZe8PjB1CEnNqpRmR/oIKJukUYiSmCEvwJ91Y1iZLSeyG8HKzksLtMnAI5jEGPf9Yn3z+Xj6Kb5/rP80UxIta8EhWq5fSkEFm0zHfucgWc2o48L5o9rZ80KjKN3MzjOyb8KHBx63XR2mqkN3Ix1bZTndEErfh9DU2h6nDDNl07lA3K7Ttu2OJUVUf2cvd91TV3O4QaazYAmYlvoyF9gGVcpBNw/8MlzuUsknOaRT4IPnKgtJlfqUtOBAkCZ7md5cyGJEq9D4bTlNbnjWumB/KD7ygsJrg5rIHR5qNe6IcDXG2q2MGexoOId00CI9Q1RyR0UBANLA9YEfFOs0INJ2riMWaPBUNUvgg6rgV+lR192WAiA9MGwB/neslLFih5iWhsKhXbeF68JbhKwWZSXrrgAvRQwLiL+Lcy5UMqQCyXQZFzMJpCzQZge+oiJ2FExwCCKWk0/X7iaOJf/lD5sEt5zAPJnk/bFqZ8uTHG/IAjPC7AT7mlgRk37dU1sRvZa2s0FcIQbfpQ4Q8JERxv5hgivKAjOpfnmBtQAgZg2tBFvuFCQoize6HA4SEiQU0OwlCl6V3mtLnGBBzmcQHDB1GdNzrRIXrlAlVAnjCD8L+SDg5gz1McI7uviiZeGhfBkolZKsDeACHCjwj1P82p9FpmRN7y+AN4t4hApXEkbVrsXhCBrlq8nyh47ajG1Lid2YVgM2SX7tqEWPttdf3mAiBmj1hFz2ixDWkgNCwHijllLo1p2ekEmiwIQHZv3bSk2NNt6QiH4w2EGHWvdbne9ZVOFp4dB0u9LFLp1Kbb2dMHXjMIwShBYWZXKdtvt+cJCUwYVRSMIZEc1hlZPIG3J28rQv6DIm47nWqmfe8B2bE8haF/CmIJDd7NeU8QP6bcLg0B3AHcSltEGXvtc1ueVbEhLxZU62Ob7dHx8t/agmoj9/jAC4Xe073UtE9e/xfiusxiaVXQLcMyQfICxioMYHLgOXlXjLWeaUVMu6p6m0TZKBgWHva59zkzUpad5stSWro/F9KEI59SDSJ7jsrpqEFzwum2L6+mtRT6g4w4I7iiAey6FYtgdilMCZk6ljR0EfV9wVmTJfooMM+GpwpoW9XbG5sof4GyrkJh5SJL/rQNfoA/byr15lnGxI8CBkJOSVKcm0H8LizIErxf6Fh3QOEhPee8NlUBaghO5Eiusc9Hs6wugc7IPlaF8L2GtPJI3hXal1s9/7Q5BYwgrIPoKMOPB0Bl3t8Qk0BeBJS78UKIUXvhGhUSxfKB1E+ZbDIlD1BzmYR6ws8o0dFmu4WpRDZyBOfSi8Hp0rnJDwERbvFVOhuhjm+r9SQXu5GVtCL72uyxq5FMNHBziiEUg6gmw8N/NSP9dFr01p2pvo95OcaWQRQ3jjUJsUmxYUvukDYzuzcPqDxMF8Snt11MIhrG3YqN9YlxEhWcIv4cHoyROPtPWSxgzAYVdkPH6Ijy93QoB+4XI9CPIjoElXeIIE1G3EJvZeNnAF+aBoA1TeVy7XpzbZDQlqPcRAx0YxdgPwLiWZr4PSJvvI1p2r5jCZ5VT1y9F4QCpUbAh5PTfuchdLUnOBqyIKHZain3Jj8RMhr1p1OUrBA4R1cm0ZIiLsLGQBNeiwIxwyFMIGW0/HBGgiKqNziAChPxlq1acPeUuKMH9O+AEUukNbDcAMZOxDZHVyzrRHyxrpd6LsV+Tl1s1BbMEwgvOHH5TqTt0eoH6TUpUlv+70tVGkOm/Au7Vpdgo1P5ZyAqHTFhgcpO0pufdeEVdlJJb8uvKd8YP0zssI/mXSdq4SHEOURukLA6vlEpf7F4IgUeRYjg/wizekkods2E53qVkWWUEA68d6ygKtjeXV5okUicOKIB+Wh2Sae13lOpiMQwIQjfhOutWu+v5H5abhn1PegR/4bau+D75n+3GWUxTL2q20jW1247rHfQDxc0UcdBNsVh+Q9qIAZN8SQXcDNpr5X/WjTKJ0JM8QApa0N2bjfT7Eqhv2G0WntVP5PcvsY2kWy3annu+oAjA6SMn5kUObv2zDSPzWmiDTKpblN3Dey6KVZ28GzmXR6kmZCqAnxCZ+aq1ScOoaUHN6f+ccXGD5adpBSwB2DXlqN4Dy/p03FB9vyBvLEO6QmMxvbuwGy5UrO+OIGUZosDJ4J/hqr2Vz44XzVZO5y+mXyvyRhPT86/XE3GcC3sIO57Y3r1iOrm50WwxVmJwYzH9+k7RtwekzASQ0BwiDn3MZ3tt7+0KWw/h8U2LRjz4f2so6O+4ydyQnk+xtlcGuxdcNZSZjh8qn6EEgehrJh/52tZy8P9pnWhNpH/e29mmktmq4XqzRooqw3bcC4HwsAnfbat+92IDtcqh7XEaHo7UrmbEncpUEa00MzsgmZ5VFG1PmlmM8ozxnWfMlZtpje84qzbaXl20UhxpTD5+VoG0uzpuNP9Wmt20GjH7Vp20/U9rq0si2quCQWRBTk1GyBMAABIAABgAAPYAAN4AAIwAAANWUDhMrxMAAC/2gDcQv+QgkiRFyuU9Ppuv/RUc23DcSJIixfDM4n+9Of/NYT6HkSSrSj9/X3Dyz4oUCMAd4Na2rapauLu7u3RADeSE5FRAVQ4RtODOd3d3uVFqEojCBC2k0MAINSSQQLPu4x8EBD7whFe84xGfOEWtbZ8DtOtrz/NPIJlT2KBce5XiDf94wwNWqEIHCbTm4xKNtgXSJ9HmxLoX4m/FML948p/39yZ/UNZAioXev+TSqHNg2RrjyNzty1Qq0cx9xn48ybmTpj9veFIfgRgmyv7j+T1Y1kA2M7fMOX0J5USfIq1u6QrFgjEGPjf+j87vdAAhSKGFDV5YoYN+au0OQ0zfFPhEvi9QCAmwB79bVIY+/kCPc9zhBDd4h8A/9tdtARKQQg8XjLDAAf/Y6g3qISUOf7Y+gSzMKMGN0LzOFuzhHGuc4h7T2mZygd+PEIARBt+fCEF/6KMCERQRggN2hKD///+nkSTns6Hbu2W7ym1/xziNR82l7xT0Tp9kiVrO1PQ0NRQz7zeiWNdczvk2SJejNiddvo3i//1+QAiQ5B8j+j8B9f9nnkzeemvyeF69ebFdV75brf52+43JeTT5+5Uve/qr7bfOnsetL52a1e9/7qx5WomIMfsYIyJS/dO/nS87OWz1S+fKTtoaz1rrmXYi6z89S37BNF3Pbl6nWZZlr5NoapuMiP8TZ8h3K9HDOCPLcqmWSOOpVVyzOz+2opoIJNqSRBpZzYhszo3HSrshP8xbuWQ6N467PjO+bpQF8QG6JO7CBlmfFxtx3wbRbQ5i0SCbc+KxUiKi8xyMGuTijJj4SnwA5GDcYJ6dD1fGsekhAPCzmqzOhx+LiJEwPwgBLjS5OBt2yjs4iMuXmj85L14e7APmVpHteYUPysQo5tlZEaI4FMCpItuzK/UUf3JmoZwq8vQ8+HED+5AYZXseXPSIsIo/OSOCrA/gVJGnZ1dilIuzQXoDq2zPLTBQfuM3z4Ef96p8qfjPz4Fdv+ZnxD8qL9CT2Djy5BzYKjP0s0zt+bBR5j1hdkaslQXPrpUS9SU9Hx4rJT673vQd815vvLPh6+LarC+JORs2Soi+RKJ+8gxYK3P2Zar4z0+/x0qJehMqq/r0/6ZxzGuip1bZnAFbETESZD3hnafszoCVMkNXZLsPy0jUJ6ffv/ji3hCdsRU4Vcyz0++fxPVeF10BJFsQgbL64um3UkKwO6BNeecpu/rk/5ZRIuLgVBaiPjn9tqLelgB4CFJBoKzqk/97lRKCDg8BgigTT9mdfjtRIzogwK4AEig/I+rHT7+V4qVE4wFAMLXKuj75/9IoM/S0nIv69PRbi2sS9oOZVarHk+8vjfISPSnnol7UJ/9a1JhoTYLshJmn+M9Pvj8wSoi99A5einpRn/wrcb2E2JdwuEfOWNTq8eTbiTpDl4rbArDaRX3q/9l/V7w7dgWFDeVc1Orx5FuLuiA6JaCQoMPM0z5dn/q/KKrNOgLYUglFXX3+1PtKpd0QhyNQ3oj+pD71N6KG6A5NIMrUatv61P9JUc3rJQ6p4AFEIOrqS2P0/x6fP38+cd+6urq6bH81ef65kfkjX1sUBEl2Bad4KIqZqOY/1QP/3PPnk7euLt+42G232816vV6tXlRV5Teb/X2/erHZ/eBxPFaihiB4CJIAsIxE/3Td++eTq8s3drvtZrNer6qq8n3fN8ZI3021+dpIbEW1KQGQRHcAsPw5o/1D3cfnk6vLN3bb7WazXlWV7xtj5LDm8KKaavudEfgJ0SNCY1fq8tYTdV13P7m6fGO33azXq8r3jTEyzv5ucH/qazMqwGH42opaPe4zuXrjYrddr1ZV5RtjpEOjj4dI9fMDW4tqM6KHzKyo/qR2n0+u/uNu8zfrle8bI4c10l9jPM+zbuBeu0EQWGu9PcTsBrUTPSZ6yOxa9NVu+7fryvd9Y2TAxlobBOHPTqfzKIriOE6SNE2zxvt7qPf39wBwn2XZqzia2SYjshnQzxttTuxL7kMSiZVGI/ualgcxnr0Ows/M59FNnKRpmmX39wDAfUseNkujQHE3g/lKJWqA/fYmknlgpFPjdG9sEIbTRXQTJ2maZfcAqJcldQc9Jlnw3ZcNsh3KRlSbEgfmXWCkp8bY6zCczaMovk2z7B7sEocmSHYGgCwZe5o8HcZO9Jg4MN+/lsMaY4MwnEZxkmbZPbg/RpflndXMfx7CzxttRhxsLh3b6zCcR/Ftmt0DYGuMPlNPkc0AvlKJGuBwxUzEtDI2nC2iJM3A1ug1OTTwXaPIx/u3EdWmxOFSK669ns2j+FWaAWyLI81I2/bup0U1SYke8m4+i27TDGzGKRgoft/+yNciohfNOBkJMFbkEz1biTpjLwgQpydzq2z7tRU1AHGyk6Gy6tUfimqSEidcGSlVr1bagjjGJMfileL3aSdqgOM0nkwV06M/N4p3W+K0e9W7tagL4qQk+xcrfn9+WtQgP/kWStWbb/tinLjEcSY7IUAckuyCCJW/681W1BlxUpA4JNEp74zy6b78hag2O1bshO4ByK4Won6sL2stKnE6kgAxQE/x657+pahBzhNioFyIuuvLWrshjjHZFQmQB+MeTIxi6p7+taghTkk2H2pPpp6ou778jWJinhBUAaLPzD1R/bqnXxU1xCmpkegzUyv6J/qyESMiJuYpR2Ihjbu6p9/3lRDHgjwcW6CnJBFbadzUfd2JelPiWPYAoIuekkQy86R5Xff1V35VCcCj0UuSODhV5LdR6Enbbd3br4kalTiO1A/A5m7YFnma3MzDayPtzb+v+7sRIyI25XHgsIE8S9PkZjELrz3pdPX5ur/f98WdcvRIslwul8tiWRRF0U3RniSAPEuT+Caaz8IwDKwxclD/J+o+78SIiElKjHpB5Fn6bhLHURQtZrPZO6H7cjqdzlrOG2efefEiDKz1jJE+/+ov173+/ErcEBwvEq+i0BoZ9Wr3vbrn/yrqosR4pzMro25W229+rO7/PypeMl6xldH2q/Vm98OP1cP847USguPENJSxNX61Wm+/8fTJxz9WD/rKKHNinCMZvjHGr1brzXa3+/G/e/Lxj9Vj+Q1xTTJKRCitvSAMp7MoPuhNFEXRYrFYzGzD+k/q/1KP8laMiNhsjJgH0mxmcYqikd0XBRvLLNDMZT3Of7xWpsT4EoE0hu+CLvpMvFTEn4zTxFcifjg+CEUP0oLo/4fETJHNOF0ZxyQjVESiRySGSQSKuRqlfxbX3o1PkVrFvEu0Za/AV54j21H6JzEiEmJ8+ULU2wJDnivVR2O0UaYcneLWUyJySLyzjlyM0VqZjw9n4gYgHoaEqbIZocdK3Gh0mFslKQAOiZGIEVl9fnwmvmPikWCbG3Gvs+IBJEEOA7zznOpxfK6MY5ORaMupMkPxQH0omXXM1fh8S5S0HJ1AickmDoAAEYoxIk/HZ6tlHBtYJSWGhPF6tjGiBuOTK17WBgPkWD1ZG2kcH2qmDQYTjM7TlbQN8tEqGzCYPBAjYi5H42kl7QOMDhRJiAeQxGCZWeVqJJ6sZN/xAQMlZuFguGXiOf5kFJ6tZf8gH5+ZMgUB7MFekXNxVp8fg52RlubF/w1GanljHC91dDb2C4G4m3r4/2MtLe08JWdKNjIEU+vIgtTYsl+xcczl8J78d2m2MYgPodh0XEiQoeKlfSMBsoEIxP313xrcp6TZRg+Eu1CSkQGwTDxHQlABmngYUG2IRN3VQ7+QRjNHQbiMRIyYuBwdMlRkBlJBL9js8F1PqT4a2k4ag7QgdMaOROMCgChvjSIvM7pQSeLgJOEytaLu6oFfiG7mRYlmpm+LiH3F0SGKhSbe4lWGoijIgiT6+PDwACxTK+rq8wP7BdG9eEm0ZRp6QUKMLEGAkSYiJlwkaQYul0VB8mB4KIrlrRXV+6/1sL9TafZ1CbANiBzEOEemSfWCafwqzQA2guyAanE/l8aLeuBbUb3XJY4ks1C69Wy4iOM0ywCwa6RzI43beuBfNVpc5keCt1YO7F2H8+gmTpI0a5smcRzNrqXlth76RtRZiSPJ2Eh/jTGe5xlX9jV/Xw/9mVFsjiPJ2Ihu7CIKvQMd0P+pevB/JeqizI8DE09UM30FEulnZ9ee6V/1UT38tRgRsR8QR5G5FdUmJAGQRP4qXoTWM90YI6aLTT38Z0bcaYkjMRP17ZRopos8fRVH08Ba6xljWuxpPGsVczW8b4gRES/hcWDqKTYj9qcLILt7lcTRfD6fhkEQXNvGYLaI4lcfvm8d2Q5vqwQ4FjNRU6J7NpZlSaI5B6hPlepxcGtlShxF5lZZoJ9sdFoy8RxzNbTHStyoPA5lJK6XEgDJQ3XMPHDkYmjPjOMlJR6OAUNlCgVDnSmboT0V12YliiPA3CoxMWQulNXQPq3hSNx5jpcOLDZO9TiwCzEicg3i4RjExgnycfhoYD8+RlMMLPFGYXdcIhkHozyOgj0uLzUSHEYk7urzA/uxuDYnjiET4wT3Dt0hEFNlUw/8qZYdicw6JtXgsH95oOyG9kS7Ow5A4Eis6f1LPMdcDu2ZcUx8JDhVQlBB7wiQC3H9yTjI/FjEiiSa2h+CAIhAWdVD/5VfVaZHArBKAIJA3wiAZWyU3eDqjRIci3KhyJyAA6JXDyBCcf3J8HaKBY8DM6tIRAIger+MjbKph/8jxbs7EuBCk4gkev7wgGVmxTVXI/BxRW7KY5EHmswylmSvgCVCUTf1CD5WyvRYoLyzmthpnIEk+7PEC1GrxzGo12JEJOAxIMD72GsQETuNkowsS7IPy/sXopqrehR3is04fgSZBrKvCaZRnIJlSbIFSbBVDvJ1IPquHscfKiZe5qMHMPakWy9cfDZJc1DH/iSzyBN9XY/kMyPujBh/3hhpb5pUG06jOEnvybIsS7oKSbwfB9L4a78zFvVaCTD+jI3oJpjPrHRrbDBbRPHrLLsHVdy/F82sNP/a79Sj+VeKSZiPW85bT/R3bkFmUWi7aDT2OvzZuTubhUbarv+0Hs8nisyJkc+vRbVxsSxIEmk0fdvrqHOzrcd04isBRp5zUW1aFA9wSSKN54E1vVn9QT2uWzEi4t1x1JhZxaZLPmguCaRJ9E7gtTOtW6x29dh+U9RFOW4LUZPiAfuyKArmaRy9DKyndVrtvleP7sRXAo4aAuUdFHjYBwBZLEsiv0vieRgGgbVmL/NGPcYbxUs5Ykytckt0zWYgz9K7OL6J1HhhHLkYpa8rEpUAyJGKjRPkHZFoyz3L3CrbUZr4SgCCozUXd8GOALCF3gAiGLF6q5h4CWKkGSrxAbpv2ozTtxQJC2K0AiUZRDhm9UqMiHi3SxSnynakfk/UsMBYt8AAglF7rBTvdtk/sh/Q4iFkVtmNVL1T5GXRv74yVCKyd2XiOeZyrL7vKyZZ9o0F+1FGSpD3jozE9SdjVe/EiIiE7BmZgR2QHSSeI0mv6CBU1vVof88X18TLvE/M5kF4xz4wt8oCfStTq+zGq96JEREJ0FMSADEVEZsUe7ATcKp4GftFzsU1VyP2PV/UiHkLkocpUivGiBcXbOd28MpzZNojOreesq7HfCfGse+ziYdQizxwxERk3kR9LzBQ5Ia9AUGEol6M2vcqUactQOKgD2Ak+hxsYHexZmI2kYchyEjU1edHrf4FMY5JmNMhiUMToSZhSipoIAmyDfhSES8uqfBQQJkY7aIe+ZWoQU4AJInDM7Oa2Aglm+BSbZNbRbyIBEDi0GXqibqux/4PNZkSIPoBplYTCROUJQE8PJBd5HzlKSLTlATwUBwiR5laUf3J6NVbTaISIIleMg0axIRxxmVRwCWxP+MGsVFWLgsAIDvKWSZWVPNGPf7fqTTvrkTxgL5mswYRuZ4nGZcloT48PLQDY08TCaKMyyXRcQ4i8kTf1sfwFzS5xhJFN+R++fLn2oiYYBalYFmS6JDJ2w0iweIWy2XJLkgkoTSu6+O41SRkgaIfOVPbzrXh/CYFl8tlQbYDs1mTiBcukgx0m0iWzOKpkcbVF4/Ed1diHJmTeOgFEUi3NpxHSQayLOkq+QdE5DW51+EsipMMJMuyLIksWQTScvX5+lj+kS/6nMz7QLwU3ff3cI0Np/MoTu7efx8sWZYlWZbp3LZRvSCczhdRFEXzl4GRRiOy+XJ9PN80YhxZkHkHcMgmcib6r//2/974ezUaex1M54soihM3fS8K9unc39VH9T+IGEfmZAdslxMzcY1Uj3Vdv7VbGccY0661McZ4NrAHM0ZE1n9RH9mdiHEkzAiArag0Mw9Frz6q9avtysg4rn6/Pr47EeOIjUno7IBMA9Grj+qWX7jarSu/hWkU0wtjjPLf1n/1+foY70SMI+b/ZCUBkJpKOgUiT1wj1Uf1vo9vXmzXlW+kpWk+kOqvtt+qj/WFEeOI2BuUJICHhyYALJmEohpZfb7u9nFydbFdr6rKt0Z6avxqvf3GpD7mbxhpDm4yliRakiWSmZHG1efrwz5+9ObPXF7sttvNerWqKv9/GrOPMX61Wq83290PJo/10b/ym0Ts4j2UZVlSRxqFRprXf1r3+POPH03+1+Xl04vWn7q8nDzWJ+Rk1ULEhIv4vQzAfRovQittt/X5uTUtXO86DMPASnv/p+tz9GrVrtP1n9Vn6q5yTFe/9rv1+fq5i5WRjle//zv1eXu5rcxeptp8rT6DHy9361XlG8f41Wrztcf6fH6cXD69uPjU5ZuP9RkIAEFOTUZ2EgAAEgAAGAAA9wAA3QAAjAAAAlZQOExdEgAAL/dANxCP5CaSJEfK1XsS/tN6Hm+9e3JpOI4kyYkSrTVO4iy+8IKT4ziSJDVKMeNL/hskO/Q95hu4tW2rqhbu7u5kDhGR90IzUAA9aAl0YJG78939Rymzf4SghwFG6Pe5+8MfPmHADG/4wD2mbfiACIzltwlDhPkN/4iiHhMQjCSllQXwQAUT5BBACAXMUEGuO7oYL13O26ZMKfaxoPYpIStJz58y/ohK1imHB7Xr2PuSOmeUT0obUnI1spR/nnhRJ8SoqO+U5MPo/uSiobcvqo6lKDi6H+N3oXcJy7BSk5waPXOaMdz5PSWfA08SxDRoZQNycMMDD9z7NL7Ahx4e0McD+nNVMTJECUjBjApCCL7iGn6MI8+zqE5VLYMBFkRhggEBeOCE+XvuQhzxjDEaOOLwv07vOOGMF/xjgRrOx/3cYYTRk/x5/zmIXa/bH17xjzXysMICNRT7/m1iZMC//5/TSHLY0HZP+7bkHORp30Zk0FroYMQ2PevGjM6AkL26nHQ3zpdPF7V55ey2dbn/ZFFVwJcvXf7xUxH9h0XbVtTmPgkyGUOsebwB6e/d/yvp9sXz3RZ4+k8XL90aFBfbw3EsHImEPe6/9s8/NSLODsJppuP+beMd9vmD05aOT//eaNg6J+qw83fmwsbpSId/M+C+mPizAK/7E6HfxNZM+LlQ4AbRVZZLlCVR4Okz3zcQfnh0ZARpXugpi2cj3SF/Zh7slL+hqEDeQIC9CV11G79kGnxwkENcFcu8kYoKaTgy1fYPcvlcE5qr33jqdmkWPJWPlqqlbSrkM7XBrVGwl+Arldpmhsq2N8rIT24dnUCy7QyCy3GNUVJ1ChYIZIx+xxw4F3JJexSQUtZTsoyDrOpSCliLVH5TcWEcdKsptXukMMomgdCh2yF8JTIQuu7iWik2D8ii8UPjZBNsscI7mKYZBTJXrmyQBBWsnStJ07zQJcW5GfCbmpd10RE6nunrZsBvyEhpYAOTHPSBOi4oSJKRPPw3hFrKgSBErFQ0L65MIuD7gqPySyTIhEEabiVMnlDBNQinuJfg5ST8sYWdyDCI1N6nhkHEmfOCKLE0SOJyLGFR5KbNvhCyGJcMI6nZAxPgc6THskgMIuLaKC2p8EjhE81RMyiIYA0yLvi2dIMUC6pgA3NgJ5fcELfcGIFbIi5JHQlnBsAXBW0JYnO03CqmJVQBcsnYCK2JuQZrDvn1Z5V0TsstYWcOs1C69FzCn/yuMdIT86bfltMhFbNUGSS9VyzHyNIzYwwKPkNdOxVy2hi1RUIWh3L6+fsfXxo7QpLo0Yo68F8G4RFXVAiNMSZ49w9lAS51+dEYRxFXZUG04yuxMXw6pkWZWyKTGlPEnzrWuY6blrSCDnFujBFBWFLxiIExTObeE9oRAWGe+Nj9D8UZMyo76+Ggz8PGGJ5LXl50zAEgncHMMYV8598FBWcMa6HEkWOKNl/+T4doIHQK69xW6Yh73u1D4PJEH39JImsvJbpl6YVKMu6V02upEpdxLy7x0sW5fYAdtsDG7u3hKNG4JQGH/eZzL/4fQy/UqPO+lC6t5/QltD5dPHXvnu22m721B7lbRU0OKdnjfvctJvjx0VEGBCQo7ZTSgenhxy/OH5y69639Qe5egs4VHUlTdPhXHuMBTR6VCLMrp3S6mFD3cX0lSR3s8CRx/GX/+ANHVVGQyTjaCHf+9OHpejp7quvjjhcQj8DB//tnfwhCOxogUoN0mziXLqgjx+tJjFyFJp5EcNHig41fYVKJJFQLR8Vevk303q3uiTx/ZoN5GJ1oESe4vkmBTKYnQC4TgOwmiaOZqz/tHZdK3Y9qI0FwE+x4rzz1LabBPLI2tslV3a9ShxaUZLObyNd9uF3vHMMoqbrnIvDdPq4jz8csjBZ179bXTd6pdy2VEFVy+R856FmW+qqGY0D38a6g7OK/CMJI7uEnut6tNP1KT81nCyCbOehVNfb+WD7rKUGliOJ6CsJFfOrjJ+2uJMuPEPXq//3lA6i0zVh6rbt5No/iJEWm/8OxwyDEQpEr9lnpqswpIPR3f+vX94rM5hSXEmCZfgWVsnv4oAc/DqX/IhKRVjKSjufPo6TpT4iG22C7O+uryc+EQ2pCcx1GV10vqw4RVyyL1JU4xg293FZTifh+3g+xjgT9lB4btVI1jK7hiepm1EfyVUcz1r+/CdaToh1t3lhX6R6nKpCwpc3TVbrPsYok7Hs4oljc6wF2tRA1Dj3Mb+bn9zqsAlKOaaeVaJkgcfiQsI0m777HXM4mbzMr7n2Autl7whB5Fpkr4Yxc5TrowOMKX6pSxueo8G+OxpPh3n/xpfi//4cIHx00RoH3PJZVImgFHr8ccJveBXpolsFMaE09/veotKnuy4Du9mtb4njOMQbIO7PliQDqRQUd0CWML+n9VgYJgPJ7QLcYmSpgPbsPYpAEEHwNqu1ONyAeyYFQuMW6vOj2LrDo46tqCQCp54BaiPsZ/lKO7sJsDp/Kxp4D+mmCN4osj3FghbW1zT+ly3QRuE4f4TV3IMP9NpvuTkGZblK/pnEUNM14jyPhMz3+VT7RRQ+hv8vD2q4K1+7K5vQqjuaBP2mnAf46vRGomxXMQylRoaOygQo9ac4lt0tkKa7jRWTnmFnfBUbtdb/k1iXfFEOQ3ZaAXaZJHNl5AMx8wFMICgUzaOnXPiTrEQhaff7+R8TGr/xHQoBNQv/UdczpuPtBT954nGvH0xH3uuK4f/uZO3L67ZGcLgsuO2jec5nXPWye/uMLd73Q57X+Ogx/JpF6LPsY49oWdvuF5559pn+rXzcvWTFHGqY+4tTBdQ/vvnvqYrBxZVBbr8u8YMYUwgaOFiMvCKNHcXKNxypdJSeKa5Ls405kJQqtp2L3/dPFxJIejlWrijXATB4B6+vKZnFan5KGS2imFqcUsn80xW8JmVmqcjawkB0AYKfqnpdIg7e+LIP2XPE9zVHBScABa3VXivtG0ZdJFHN3kR0/JhFNk2pg2u7MQGoEt2ftkBfxY46xdFXZUYeBHMEX57GedufoCDjiil9ApArEu4xgyWZ/xZZpyxO4jAEBLTK3vdpHKaWBlTWLB5b4nZEjWA4KECuG1Ksu3w6JhUxcg+njpS5EjQkvaFmGYJX3C6Qu3ykq4NTw+SEV3XXZVJWnfJ33v6CAadrrNn6gAQK+FSFhzq91KB+logBAMS/mhuNDZwVHIwPdQCiqKPSpHZsj5omzsQP0BLL7QVyRiAgGh2e2pz3GeJ0OQLcNETs8uwHAGnPl4xCNlDshZIYXNgBzKNfHrCMAS8AoB7ywEw57lG/Iz37sDGjQVY++43YXBUSg/iGAG1KZPf6rnGgbxLTWHztqBW3ztMyEI2Rw2oHG+z4q+n4Ja/AYF5zpWrlR3cXpSAOAVRQq4iMidLV4ZCHw2DbswS4t3BphkVtw2ta2VKYD+0TRcRikgP9UanvN/SRUP/hyUo/7gwKsALsGZm2V2qDcVMu/4y2f4KcrzUf0a/iWF2yNx+pPVKvhH9FWZR4XMc/GafXccDxSDahYlTToKmaZ8kWSigAUqT+TeOegpbVU5I5mUg9xs5UrNc66QtFVdLUkQRcTuJ7xsiNjsmz4ZPLhC5Y2glWuVcBOZvF1dvp85aooITXtfLuptbdMeMTx4Oy7W0274PrzRZJmTYwS2p1yqlHxHNjMdZQNJ6ReFy/8+SKW3sVa28ZaaJnGvgNwqfRlxSMtHUoAEkEwF8rE82fz2lH9sTRDCIDHSRyFDYtx+IBLHA0nxOSa9bZzjex/csek3CuGglITRl4Uz72+TIkEh+HfO46EZDDxleYNU/lWcR35kxGVUVHndVcMz1SK8pR1M8C5N5Ut5Htmdap6E0dTzx0JCmiE1lzSYQEGRyWdE8xbrpo54bKwtdHgzKutHdF+7ifB52GQzzkS0iIfBlKhsVBaNzNCVmfbmkC2mdRaTM6CeRTf5BGf6F/ke9uyxgA2JRZvrvK1bcsRoyOprPGBAb6qYxH7Cz2UByvauTYaxgyIlCSXmlMGN1HaZwOlZZc5gsge53zGpWY0EFg57RV5n7C+XMAFcQ+9h16w9OR0kfc6KdSMi7h+zIdbojQRSGjQWX677x9Cg+EcdaQ+GA797CDmgj8eFhwJnyxy3SbV6wOH+zXxuCVotzWjl/EwE01CO4BWCBzeKwBof/OTQhdoSyGBTbNjj8KOHg80r/qqAqwtco+XfiYs0APP0CO/NKkvmFzTljiq0hEXA+hNj97VffLHySpf9zWRJRCxsfTfKdr/Mu+9mNQA2q+KvOwL1uNS035bcdnhhs7a03iVl7DW9oDqymFjXfGCkC75jAGI5R3Zam1tHy+wPiOHFrkHHpcDEV6rkXfaepKG6uR6bA5VFv0fkeyJb+pWVPSfYKncl7gYff+N4rwyEFj7hlCNOW5yKbmkDPZ1Vs4NO/4utw28QWk9jb7ClzNAGAJe7mrfHoJWTsP8A4+lqd91GfM4zeWZxjvv2VPQO23xqRizBgAlRIpCpqEofJRkBbAC0P6LskDma5QVXPBrWejEGpowd1rTZBbGddXK2pZNYReuw85VbTOMgsbQThEjTlUX8Zu1zUFloSNr8STxHYa+qJ+VP8hj9kAZaXxRg6skaO1qP5pMZ2EUJ2+mmZUeh5HZq8hrnAGFV0HIH4nGHDErVrZMI9/t+ASNiS+R5wrilTf2MEfKUHQ08FJpKFSukKfR1B2RPuhGbD51xwpfdyS6LobBGfsaWy2UKGwaz31d0dBW1vmNQSSRjvRGS4D2Fya9igJPW7XlU2SE/kFWzA7qLnkjdLTsSQN7KKncl2mymPsdTA4E01WU7liamLSdStLXBbRiLZYpkmg+1b4L81VGflOxUh2A6FokpU5e35qfLKV3SWJ5+gwEMl5k6lh/lH+yezAYBKglepNcRdd5orTMUjKEiRQQFeCLSGHCy5xakIkb3qvC+aFQeWS2ci1Faxyt1vQC3JT5KoD2vVUGaJ0yRayCVsfBG+8qzAzTBGQISWBvydWumQasKwudqpBOfANQJSTEfSDlvuqjXygHLhU2jvQFpNmSRo52Q8J+1WZ6I3AAlBlUibBhYaykiNgvEnbr6OS5oLVpq0DS/4j7+qGCnbJfWMaX5Wh0itag22AXwaKhD9EaN33Z7yAV/J/SvlWLofzEgSTMhYMZzRkqP4MzakC32sQhRAoLS2YQJuqhPIlyK9QIF0CbdtUlNwwger2ss3JLh3rLVmpeh4LrkWKA27iBxhdkyxtfGStD85LyJy5QZVaShW/H3lOcUT9RNWwAOmrxhrFMmFccRe5R5CCMlHONiyq369ISCHoQVQ2h0wbrN8fMRwdB3YZ8pkExz1byDYngeam2qMgQOkNZFc6PhEOvq4JOGL/IVzbvRlONF26l8pcdQ9TgfTqIJiNa5eQjjSTKXzypbEHyCFcby3/A67JDWBba5+kOgY59eKjqZ++3UZp3ycDyzx01MykqdKmytFUeOP3m9fdEVkL89amwwa/WdpmQFJmnnaw1r1Zlh3e98h1oFy42jCxqIf4nZe/aRmW6olJtNx7UkB9lRbWqylZjjXQ+cvSVhpSFiGpbWvtrjQapSZ/8l09ORasKkM4PyhaOtBflNEoy/SAEqL+kZK5T2O3uagwqS8QVUdD8/f9hC42qVytU32zyJQfihstS1CeX3GTKudk0CX3hDDFY+8DRro6hg3ZBY/URapRmu2NLfbLsSZ3cKO9S2TzyROO5uRN/FtSkm3F/iGtr3Grn1mjcgAYsdUcY/9mdvd0dRLfnyk/ltR/ENvSovG5/fjcwestRaC6x+no0eGQsC8wb7/bnm2ODr3h791IKXTOE/fRQl6UEwM8qZUdt2nD3y04tmsflPz3b/FqwmEZ+85mhrsdJP86xaES5ln7b3bZ//7+62G0OY11VyjVuqGd33Hxm8P/bhphnCrdfNJmCrfK56HbbuzzfbfZHqam+4x1B8hSIz90Oe8FdOjMYHeezlqtWK5kr7i58un3pfLf9W2klKxQvAvaw3+y+/eHdsOlrjnbnppDt2dYlilVlkcnTmNCJ1D+4/elL52e7p9ISV/7zOLZ/JIA/bFqNzXb3nfOXPrgf1mQ8brBlTLKai1sBWZqEk14tm/7jpy++9HsXwO+/VJO0+h57d78Q9k3WfH4QWjufau25hIP9j+9MRLsxxTQmhqLLbced/bt35qLLjbQjGn/eG0ybzFWhHbc/3nz2zoB08dUGts8e929f3pmScGJ8NvatTf37boT/tsoCAEFOTUYQEwAAAAAAAAAAPwEAPwEAjAAAAlZQOEz4EgAALz/BTxAX5DaSbCfqr9Ca3MjfxsVTd2k4iCRJkXIZjl2cf3XPzyCSJDX9YSYR8a8haqKACXZt26akVbZt2/pSBhVABVHhOI0OwLb+bNvuqGr8jyIUEEAOA+QQQDGe5Tc+cIc3vOMB22g3+yvELBaGPQHNfiYjX/1pSsJ8pJQtkEJOet3kLRBDxrAlNGvEsKRUV6B6p1QzoloqSrioekGdAv4Xd/uIctp+ExX0y0VS07eEZz5c34/93Oj6RCOlaOhixN/O+cg57oUyEuCBGgaooYB5PjoZFBBCjS1c4g5bXSv5JSAbv0Drl1x0vZRCBS3WcI5rPGP3KyvIwryOWQEd1HDAhSGWmlkS/wgJVSlAEno4UIV3uYYXHOABdzjGKCaqnjVCSIg/hP+HCKyhg0M/VLOQ4BZ/qCCGCGIIwv//X1PjuNa29o6dXSmnvHpvrl2BcoSgxabcdhGanfVFaNOudnoPLWWeOsqckB1lHpR5nsSffi0kRAmK3xzR/wmoX/n/lf9f+f+VvG/Ptpv1erVaV5vd31+ML2dVSftyud7+ZFQ5W1GLvP78cixZVkREvBczExGtduPIyxW1ymSvvzCCvFvSnsyO47DSWO5Gj++tqNH4s/hpkiRxOLl0mog2Y8eGdDdIZF6oQPoscJto/d6o8Q3Sp28CkEYAyCK3gdbvjRmVFgJyKJBOWaNqxPgjKx4gLQKx0Wg7XvyG1BTSLhLXYqL3jxZrxYO0jdQlImIqb8eKUonaE2QuqZuR4m9scXIEQWIUfjRO7Mg2cgwpXldoPU5slS/jKJArhc5GiY3y5DiC546yHjH8Iwl8hR6MF5OjPXOUzXjhH0tkovDFaFNECp2NGHJkZK6yGW0EU6W8HSumHYjZoofjTeYqu/Fh3RWBp2zGh5USdGGqrJYjRdiBYqbwxehQKnEX3jAWvW9suO3QR7QHY8MjVpIOIHOJiOlspEi7gCtlNzb8jmzOOiDwle3Y8FvFyHizUVzpIibjxFqZoBNX48RKCbvhKb8cGW5LJe7SbmT4EalJFyCucjYybBRHOpGNE2vFlS7ixiH74bhwWyoBOhGR+mBc+BapcTcCZfXuuFApTtqNibKuR8XlSvHkWBARZK6yGxd+yEoEOS4gCyliR3k4LmzI5vRYIgJBQDZfjAsr5cvSAYFcKet6VPwWKxGkC4lDREy7caEi20m7EZD6YFT4WalM0QVkLhExretRcUvqU8jxM8SsnI0KPy8VV7og8Mnmi1FhS2oE6SASR9nUY+KfVopJuxGQ+nBU2JEaQjqI1Cir5Zjwh5XCaSeKkNRdPSb+ltQA0kGIq5S3Y8LPS8VJjwGIABApIlK39Zi4JTWAtA9AAIFAPIUfjQk/KBWTHkcAiAgiUjf1mLghNYQcQwBgIRBXKd8eE77BymV6FFFE8pDUX9ZjYkVqlMuRIZA8NUr5Ykz4X1I9gYjgGCIC+KTu6hHx5yuFrwvpwjUREdO6HhO3pE5zWEeGuBbxozHhHVZMCkEHAlK39Yj4/RWxFUE6iITU1XJM2JA6hXQQ4mln9Yj4Dqkm7UZEalWPiD9faRGkg0hZ4UedeuvxxcXFo/Ozs7Oz3Xa72bOq1vaXv7xutWrcbLe/2e12/zg7P3908eLFW0NkS6onnYRP6rZu+a3Hjy8uPvjo/P1nu+2mqtarVWmzSnedmbksy3K1rra/uBgSXyDVSdAFPCe1qvd8fPHo/OHZdlNV61VZsk6nn8v17q8D4S9rYivMpYMQV1v/tqqqar0qS7app3m1+9MQ2JHqSReBgI7OzLwPny62iIirr/feD/5LceKiEzENUK6+3XMbUqeQDiIzd4BtxxhjLl3vy77vT4Mg1GezKIrbj/TZbDYLw+l0+mHP81zjcAtEzr/22jukumk3IuJjsTHm8tL1vA/70zCcRXGSpGkmNk6iSJbe3MRRcOWafYg2PfanlcJRIR1E/jodzsYYc+n503AWx9dJJjYOldMLAJKEHjfRpr92xJYP6SRSQ0TsGGMuPX8ahlGciAj2VvoRKJAFpoE2ffUDJtukXUEWTMNERATN0uv5XALW6KynNsTWrBB0Q6DKUFyIYP7caHzRS18g9YlAhvs8dRXa9NKamIhMUsiQR/ohhR700P+SOp3LsMczR1n3z3KlXKYYeIJAoff1zqdJDXMZ/JlRdn3zqY8rrmD4YapUffN5UsNC7gGxY5Uv+uVLa8WV+yBSY9E/98tnSQ2Ke4G4yoN+WSsmw70AHhH3zTdIDYpsrKkUk8m9EOKS/b4++T2p0yK7H2RG+ac++a3iJJD7wY1S1j36olR8yD0hJHvdJ98km6/vCciMsu2TipiIPMg9ISCbH/XIX0kN5/cDJI6yrnt0p5gkvx+IR+pZn6wVD3IfhPiklm/1yF/Z4nDeR7BFBGgLnYNMST+re3RHtknRTyICQFrvGoo3fdKruk/XigcZ+EAhsUt6+aJPHrMSFr0DnBCgKJBGHjWWb9d9+mOy+Q2cuhw59s0Ph9o96JI+nfmGmsuXda9uFSMnDXkBSZN4Fkz3DoIgDMNZFEXxdZIkaZqKCNSimNtFURTYszgQgEiWPo1noe8Zh/Zdf7Hu15XiQU43ckmiqWccptbZMbbrele+Pw1nsyiKm6NDZ7NZqAZT/8pzjcN08Lbu2QtWwuJ0IQ09hzrPOt3BT3ym7tsHZPNTnCpIeEn7c0fubLn7U927P1KMnBxoiF3q0fXuT3UPbxQXcprwukN9uap2f3uv7uWVMj01EBsIaF/j+dMwimI1ssMwCIKp7z/xXPfSOHwnmMvV+v+3v3iwrPv6RalEJweyEMCnZi+8TgV2nuc5DhURSdMkuY6jKAyDIJj6kyvTUK7Klf3xtV1V1Xc3m812u93t/nH28MEHL14s636/YMu5OTUCEckDavSfClRpFc2FDV2QfEjbfP/23eVyufzUe/UwfUi2kZMjIvOIdDcWSFexb5E4yurdetj+Q3Ehpxep0Z5kkOOjYf/idYU2A2enfPgkeaQ+EcgdBTylvB02W2VanB7ErLgC6SgACPYSPHMs2g6b7yrhKfLI5hTSQVhtAp6yWg6atcUnCJlRgrwbaEkQsVXeDqAYp+ajxYxsTiEAOoC2PmKImPh8yDwqLef0CK6UK8kXnZC2IZ5F2+HycM1k8wkSV4mgoCUoEEh7mJJdDZTH2xU1dggWOpEZJTkG9pQjYkbETJ/45BB5vGHa8xSljsUp8oUcTY4SMzHRajk8LiqmvTvU4UQTLBbSMgbd4w3TgRydHDSkdy4aJlumw2cQnCRKsZB2IaLJsUKyB8aDkvZ1wqkSFgKcFBFXuemAHADsB0yVdT0kN7QnP7mW+X8oU4icGHjKDHI0HEdcZTMgHpXUzEEmEDwjYqIJ5NTOfcUDWhLsewgsQClujHI2HF5janSCDCIiSNjyIIITM1Po5s4AIoKQbD4fDK8xNfoCaJmxLoFTAzGKJ4cDQJMcAAggqgJ4Snk7FN5h0t0kByD6FRGRCzm580Ch13EIDpdDYYtYRczKph6IX1uR7gtEcgAWnjOReQ7BaVkIEkehZ8A+aFGasY+oEJfs8nYoVKRylENkIU1IwjCFQE7sQua+RqEATSKiCCBHB6akbuqBuCOVrwtpBCAiAgByml2NTJBk0AWysKWDmEeklrcD4QcrYiLi67nsC8gJz/KENSIyk+gmAwogz2V/tIYiYoXP64G4ISYiigrpTSQeHciXfpRkkud5DqChdUhI+qYeiD8rFR/oCyBiapWNF8RJJmgUAIcBSFzSV8uhsCXbpIX0JBDSUdl40zBOUhG0KJJGX6bG8rYeiJ/8BDERBUBvhNTM3EYjG3cynYbRddL8PAqnHlNz+bIeij9my0kK6UmE1Gj8588C47R1IFOL5ct6MG7J9gQ9gYg1EwqAXP4z8l3Dx2rzy1+th+OamIjCoify1JDqZXOIjRySPQsnruMch4ltjTf1gLwtLY7n0hNPSPXzXPZFnueS3URT79I43NKBVT0kz9ky6VzQB7hmxQdERNCgwpbsJgqnnmsch9tgh5Xydkj8jmzvzfxU4RCfbCMQEcEBjbAlS57Fs2Dqq5OJ511NpuEsvokdi7ZD4rfKRCCnGnshNUoEEYHdho72r5TVckBslAAnC8A+xYxsJ4UscCQdsoeoH0XEFl8MiEoJCznZ+8FXfIEIIB1oE5lLxMTng2N28gBLXCUEBCIid0HkyqJf3c+QGSWGWLgbCMje3LtUJAonCuSORERMVA2O8HRB1545lkkhIncndqz18MCJE4jgoLuKZ/ctGxABIEiMxcnditiqBsR3+0IEgsy1KL5bIVmbAbFVJtKP8JTXgbsCAXxiIjobEL8gYqIrQT9MlYncoVxci88HxJni9cQ8cixO7wog85iJiMrbAXHOlkn7AZlrUXB3AJ/sqh6Qt6XFcdELUkwVTnA3ROaJUXZDYrmyqB8g88RY5AruypRsfjQk6rUyw+kDIJL7Cl0JJLsD88RRqnpQbhQf6IPFIk+MQl4CQFnk3QE8svl8WOzIdtPTJ5DFIps/cxQykzhDkUNsdCUgdV0Py78zMZFJitMnC1nME581InYnsxTzeZ5LR4uI9H8ZGLclERHHOH0LAWaGDjReEAvmc+wBoJ1Mipi1qh6aFTERhT0gEJ/adNyr8A3BfJ7DEgHQQgaETGp5Ozi2ZHuCkwfxqHXH9aazFJjPAcjhmQhSnxof1oPzF4pJTh7Ep0bH9b0DVONOgjjFfD6f54CIZLoAaWiocVcPz5elRdHpm5JuwiSTLLrig2w2nj8Nr1MR5HkONYt8Q83beoiulYngtCEi3U+hZk9Djw/T2Vy6nj8NgjAIpv4l0567epBuFJOeNmSuFuYQHSJJeGVaaX/1Tj1Mf8jERBSduJDUAJA9AUgaB1emK9uf1wP1Ux9XfDnlyFzFE8j+sCW9Dq5MEzNxO9U36uG6IdukOGFFROpTSIuwJU2iYOIaarvc/qQesj9SKDpl8BVPWocqkiZRGPiuw4dU366H7XKl+IKTBfGUEK3pAHIAkqXJdRQGwXQSuMp36qG7UZzkhCVGiY+lo1lEECmf+OTQ+SFbFAInK2brMu3G/ojZWi2Hzle+TExEbno3AHQgItuTzmWIHau8HTr1ltQovxMC6cBMmXRPkJiB9JNSuRLciVaBdq7uwnNltRw8daVwkovgJBzc4N2FiIbStxTyAekyAHQlZsukdyBU1vXwfW+tOEmnIHEk6EhqLHrjDkyV7QCqdwr5QHcgE2YvRSdEnigh0DFkrnI2hP60UvimSyER0WWK/WABhyFULt+00KF5ROqDIVTvFPIE3ZkSM5GbYh80tnDtEBFTCEinc1/5xCcH0Z/XCkUdunHIdlM0QJM2RK7IdpJ5h5DNrx1lVw/jz7FiUnQGE4XcFBbQJG0UsWORJ+iOAD7Zzr8NpLpSaNIZQeYqZK4B0bVW4Ss0ARogONY8InVTD+VvsEIRuiK4cRTiEAVEFsdJjEITgQX1KBlSoz0cTPVGMymacCRB5ChE3nPMITakbUQaeSlERAA5TgbxiIiYqno4f39FTER0JY04miAyGrEfAwXkmAg0MjEAERHIETPAJ5UfDaj6f0gPYAGtANhL8mvWiNiLUhTAEeBrxJMUyOWYmUB80nf1oK40fgaRhbQlB4S0t/GjFABaEoivEZkgwRxoT5B4pFf1sP7aSiGTzheLHJCj4Zr3IyIziRKBepgAAWtEzuSZYA60AkhoSF8tB1b9DivkylwWubQItQnXDrXpuEF0kwr0vUQQmQYidsM4hb0XAEjsUWN5Ww/uX2nkyVwW+WFoVhA7pHJV7mU7ZhJG16mgmM/ncwCwMsHNFTcQEZtJGCepoLEoCqSRx9RYvqwHeKWRJ/OFHIxGASQDZg7pZ/XHqvIAlY0XhHGSpm8KmgvEE9Nks3H9MIrjJE3TJJ5NDe25erce5GuN3HSOQ7CniAAhk76r67p+e7vig1R2jHG/PA3CKI7j6yRJJQ29vXRmxxjjMO1dfbse5u+tNDIxigOkQURQvOmTzcS7Wl++VpUa8z77MjMbYy5dr41DmYh4Ww/2d1casZ8C+4klIsgRu2Qz8Wv1vrdn1YrpJPL6s/WAX641IhOmQNNisRAbBZ76THr5sfrQ5fl2veK9eN/ulNU362H/XkXEFpEbpigAy0aeQ576DjWu/q9udXm+26xXJSvN3Nwea84ntj+th/+W9jThGymKopgXRVHgzZvQc6i5+nZ9xOXL87PfbKr1qmRm6iiXq2r7k0/W98KzkogVIjZ+GMV2NHUd2ndbd3J5++j8td3mO9V6vVqVZWmY+TDmslyvtz9+uazvj7cVHcg27b/677rzy+Xt7dv/fn7+2tnZbmv/emf/4+wD5y9vv1TfO3clEXHT4bz5QT163m5Kan/92XoUfbkp2+HqW/VoerurSj6gXG9/Uo+rtx/47XfXK/XL682PXtYj7dKuX/n/lf9f+f+ViwE=" alt="엄지와 검지를 L자로 뻗은 손을 눕혔다가 세우는 동작"><img class="hs" src="data:image/webp;base64,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" alt="" aria-hidden="true"></div></div>
<div class="sm" id="gd"></div>
<span class="chip" id="cg" style="margin-top:14px">👆 제스처</span><span class="chip" id="cs" style="margin-top:14px">🔊 ‘똑!’</span>
<button class="btn pri" style="margin-top:16px" onclick="startMedia()">카메라·마이크 켜기</button>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:24px 0">${["A", "B", "C"]
      .map((k) => {
        const u = S.users[k];
        return `<div class="card" style="margin:0;padding:12px 6px;text-align:center;cursor:pointer;min-width:0;box-shadow:3px 3px 0 var(--ink)" onclick="go('profile','${k}')"><div style="display:flex;justify-content:center;margin-bottom:6px">${av(k)}</div><div style="font-weight:800;overflow-wrap:anywhere">${h(u.n)}${k == S.me ? ' <span class="chip" style="margin:0;font-size:11px;padding:1px 6px">나</span>' : ""}</div><span class="chip ${FC[u.f]}" style="margin:6px 0 0">${u.f}</span></div>`;
      })
      .join("")}</div>
<h2 style="margin:34px 0 12px;font-size:24px">술약 현황</h2><div style="margin-bottom:36px">${
      ps
        .filter((p) => p.st != "ended" && p.st != "cancelled")
        .map(pc)
        .join("") ||
      '<div class="card sm">첫 술약을 제안해보세요.</div>'
    }</div>
<div class="card" style="margin:22px 0"><h3>📅 본가 방문 일정</h3>${calendarGrid()}</div>${songCard()}
${favCard()}<button class="btn" style="margin-top:22px" onclick="go('arc')">🗂 아카이브 🗂</button>`;
  },
  profile() {
    const k = V.id,
      u = S.users[k],
      own = k === S.me;
    return `<div class="card fr">${av(k)}<div><b>${h(u.n)}</b><br><span class="sm">${own ? "내 프로필" : "친구 프로필 · 읽기 전용"}</span></div></div>
 ${
   own
     ? `<div class="card"><input aria-label="이름" value="${h(u.n)}" maxlength="12" onchange="upd(()=>S.users['${k}'].n=this.value.trim()||S.users['${k}'].n)"><div style="margin-top:8px">${EM.map((e) => `<button class="btn sm ${u.e == e ? "grn" : ""}" onclick="upd(()=>S.users['${k}'].e='${e}')">${e}</button>`).join("")}</div></div>
 <div class="card"><h3>재정 상태</h3>${FN.map((f) => `<button class="btn sm ${u.f == f ? (FC[f] === "ok" ? "grn" : "pri") : ""}" onclick="upd(()=>S.users['${k}'].f='${f}')">${f}${u.f == f ? " ✓" : ""}</button>`).join("")}</div>
 <div class="card"><h3>귀가 주소</h3><input value="${h(u.a)}" placeholder="예: 서울시 ○○구 ○○동" onchange="upd(()=>S.users['${k}'].a=this.value.trim())"></div><div class="card"><h3>계좌번호</h3><input value="${h(u.bank || "")}" placeholder="은행명 계좌번호" maxlength="40" onchange="upd(()=>S.users['${k}'].bank=this.value.trim())"></div>
 <div class="card"><h3>🎤 노래방 리스트 🎤</h3><div class="row"><input id="profileSong" placeholder="제목" style="flex:3" onkeydown="if(event.key=='Enter')addSong('${k}')"><button class="btn sm" style="flex:1;margin-top:6px" onclick="addSong('${k}')">추가</button></div>${u.s.map((song, i) => `<div class="row" style="margin-top:6px"><span style="flex:4">🎵 ${h(song)}</span><button class="ico" style="flex:none;min-width:34px;min-height:34px;margin:0 -6px 0 0;font-size:15px;color:var(--sub);opacity:.7" onclick="upd(()=>S.users['${k}'].s.splice(${i},1))" aria-label="${h(song)} 삭제">✕</button></div>`).join("") || '<span class="sm">등록된 곡이 없어요</span>'}</div>`
     : `<div class="card"><h3>프로필 정보</h3><p>재정 상태 · ${h(u.f)}</p><p>귀가 주소 · ${h(u.a) || "미등록"}</p><p>계좌번호 · ${h(u.bank) || "미등록"}</p></div><div class="card"><h3>🎤 노래방 리스트 🎤</h3>${u.s.map((song) => `<div style="padding:7px 4px;border-bottom:1px solid var(--sub)">🎵 ${h(song)}</div>`).join("") || '<span class="sm">등록된 곡이 없어요</span>'}</div>`
 }
 <div class="card"><h3>📅 본가 방문 일정</h3>${calendarGrid(k, own && scheduleEditing)}${own ? `${scheduleEditing ? '<p class="sm">날짜 등록/해제</p>' : ""}<button class="btn ${scheduleEditing ? "grn" : ""}" onclick="${scheduleEditing ? "saveSchedule('" + k + "')" : "editSchedule('" + k + "')"}">${scheduleEditing ? "저장" : "수정"}</button>` : `<p class="sm">${datesOf(u.v).length ? `방문 일정 ${datesOf(u.v).length}일 등록됨` : "등록된 방문 일정이 없어요."}</p>`}</div>`;
  },
  cal() {
    const u = me();
    return `<div class="card"><h3>본가 방문 일정</h3>${calendarGrid(S.me, scheduleEditing)}</div><button class="btn" onclick="${scheduleEditing ? "saveSchedule('" + S.me + "')" : "editSchedule('" + S.me + "')"}">${scheduleEditing ? "저장" : "수정"}</button>`;
  },
  favs() {
    return favCard(true);
  },
  songs() {
    const ks = ["A", "B", "C"],
      mg = {};
    ks.forEach((k) =>
      S.users[k].s.forEach((x) => {
        const q = x.trim().toLowerCase();
        (mg[q] = mg[q] || { s: x, w: [] }).w.push(k);
      }),
    );
    const songRow = (title, right) =>
      `<div style="display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid var(--sub)"><span style="flex:none">🎵</span><span style="flex:1;min-width:0;overflow-wrap:anywhere">${h(title)}</span>${right ? `<span style="flex:none;display:flex;align-items:center;margin-right:-4px">${right}</span>` : ""}</div>`;
    const mgBody =
      Object.values(mg)
        .map((o) => songRow(o.s, o.w.map(chipU).join("")))
        .join("") || '<p class="sm">등록된 곡이 없어요</p>';
    const tabs = `<div class="tabs">${[
      ["all", "통합"],
      ["ind", "개인"],
    ]
      .map(
        ([k, l]) =>
          `<button class="btn sm ${(T == "all") == (k == "all") ? "pri" : ""}" onclick="T='${k}';R()">${l}</button>`,
      )
      .join("")}</div>`;
    const body =
      T == "all"
        ? mgBody
        : ks
            .map((k) => {
              const u = S.users[k];
              return `<section style="margin:12px 0 18px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><div class="av" style="background:${CL[k]};width:38px;height:38px;font-size:21px">${u.e}</div><b style="flex:1;min-width:0">${h(u.n)}</b></div>${u.s.map((song) => songRow(song, "")).join("") || '<p class="sm">등록된 곡이 없어요</p>'}</section>`;
            })
            .join("");
    return `${tabs}<div class="card"><h3>🎤 노래방 리스트 🎤</h3>${body}</div><p class="sm">프로필에서 선곡을 추가해보세요!</p>`;
  },
  new() {
    const t = iso(new Date(Date.now() + 864e5 * 3));
    return `<div class="card"><h3>${h(nm(S.me))}의 술약 제안</h3><label class="sm">날짜<input type="date" id="nd" value="${t}"></label><label class="sm">시간<input type="time" id="nt" value="19:00"></label><button class="btn pri" onclick="addP()">제안하기</button></div>`;
  },
  d() {
    const p = P(),
      ks = ["A", "B", "C"],
      ys = ks.filter((k) => p.votes[k] == "y").length,
      isP = p.by == S.me,
      [l, c] = ST[p.st],
      resp = `<div class="card"><h3>응답</h3>${ks
      .filter((k) => k != p.by)
      .map(
        (k) =>
          `<div class="fr" style="margin:6px 0">${av(k)}<div>${h(nm(k))}<br><span class="chip ${p.votes[k] == "y" ? "ok" : p.votes[k] == "n" ? "r" : ""}">${p.votes[k] == "y" ? "찬성 · 참석" : p.votes[k] == "n" ? "반대 · 불참" : "응답 전"}</span></div></div>`,
      )
      .join("")}
${!isP && p.st == "pending" ? `<div class="row"><button class="btn grn" onclick="vote('y')">👍ㄱㄱ</button><button class="btn pri" onclick="vote('n')">👎ㄴㄴ</button></div>` : ""}
${p.st == "pending" ? `${isP ? `<button class="btn" onclick="decide('cancelled')">제안 취소</button>` : ""}` : ""}</div>`;
    return `${p.st == "live" ? `<div class="card" style="display:flex;align-items:center;gap:10px"><span class="chip ${c}" style="margin:0">${l}</span><h3 style="margin:0">${fd(p.date)} ${p.time}</h3></div>` : `<div class="card"><span class="chip ${c}">${l}</span><h3 style="margin-top:6px">${fd(p.date)} ${p.time}</h3>제안자 ${chipU(p.by)}</div>`}
${p.st == "pending" ? resp : ""}
${p.st == "confirmed" ? `<button class="btn pri" onclick="go('plan',${p.id})">📝계획📝</button><button class="btn grn" onclick="openStart(${p.id})">🥂드가자🥂</button>` : ""}
${p.st == "live" ? liveTiles(p) : ""}
${p.st == "ended" ? `<button class="btn pri" onclick="openRec(${p.id})">📖 아카이브📖</button><button class="btn" onclick="go('pay',${p.id})">💸 정산💸</button>` : ""}`;
  },
  plan() {
    const p = P(),
      l = p.pl,
      ks = ["A", "B", "C"],
      k = S.me,
      jam = jamOf(p),
      PRE = ["맨정신", "1~2잔", "반 병", "한 병+"],
      preOf = (v) => (!v || v === "없음" ? PRE[0] : v);
    return `<div class="card"><h3 style="margin-bottom:16px">📍장소📍</h3>${l.place ? `<div style="margin:0 0 16px"><span class="chip ok">${h(l.place)}</span></div>` : ""}${S.fav.map((f, i) => `<button class="btn sm ${l.place === f.n ? "grn" : ""}" onclick="pickPlace(${i})">${h(f.n)}</button>`).join("") || '<p class="sm">홈의 ⭐ 즐겨찾기에 먼저 등록해 주세요</p>'}<details style="margin-top:8px"><summary>장소 추가하기</summary><div class="row"><input id="fn" placeholder="이름" style="flex:2"><input id="fl" placeholder="지도 링크(선택)" style="flex:3"></div><button class="btn" onclick="addFavPick()">즐겨찾기 추가</button></details></div>
<div class="card"><h3>🎤잼얘리스트🎤 ${jamOk(p) ? "" : '<span class="chip r">❗필수❗</span>'}</h3>${jam.map((x) => `<div class="row" style="margin:6px 0;flex-wrap:nowrap">${chipU(x.k)}<span style="flex:4;min-width:0;overflow-wrap:anywhere">${h(x.t)}</span>${x.k === k ? `<button class="ico" style="flex:none;min-width:34px;min-height:34px;margin:0 -6px 0 0;font-size:15px;color:var(--sub);opacity:.7" onclick="delJam(${x.i})" aria-label="${h(x.t)} 삭제">✕</button>` : ""}</div>`).join("")}<div class="row"><input id="jn" maxlength="40" placeholder="예) 도연이의 CC 도장깨기" style="flex:3" onkeydown="if(event.key=='Enter')addJam()"><button class="btn sm" style="flex:1;margin-top:6px" onclick="addJam()">추가</button></div></div>
<div class="card"><h3>📋사전 음주 보고서📋</h3>${PRE.map((x) => `<button class="btn sm ${preOf(l.pre[k]) === x ? "grn" : ""}" onclick="pl('pre.${k}','${x}')">${x}</button>`).join("")}<div style="margin-top:16px">${ks.map((x) => `<div class="sm">${chipU(x)} ${h(preOf(l.pre[x]))}</div>`).join("")}</div></div>
<div class="card"><h3>⏰귀가시간⏰</h3><input type="time" value="${l.until[k]}" onchange="pl('until.${k}',this.value)"><div style="margin-top:16px">${ks.map((x) => `<div class="sm">${chipU(x)} ${l.until[x] || "밤새놀자"}</div>`).join("")}</div></div>`;
  },
  start() {
    const p = P();
    if (!p) return "";
    if (p.st !== "confirmed")
      return '<div class="card">이미 시작했거나 시작할 수 없는 술약이에요.</div>';
    return `<div class="card"><h3>🥂 술자리 시작 🥂</h3><div class="cam"><video id="sv" autoplay muted playsinline style="transform:none"></video><svg viewBox="0 0 100 100" style="position:absolute;inset:8%;width:84%;height:84%;z-index:2"><polygon points="${starPts()}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 3"/></svg></div><p class="sm" id="hs">카메라 준비 중…</p><div class="bar"><i id="hb" style="width:0%"></i></div><p class="sm">⭐✌️ 별을 만들자 ✌️⭐</p></div>`;
  },
  drunk() {
    const p = P();
    if (!p) return "";
    return `<div class="card"><h3>🍺 오늘의 만취자 🍺</h3><div class="cam"><video id="dv" autoplay muted playsinline style="transform:none"></video></div><p class="sm" id="hs">카메라 준비 중…</p><div class="bar"><i id="hb" style="width:0%"></i></div></div>`;
  },
  cam() {
    const p = P();
    return `<div class="card"><div class="cam"><video id="cv" autoplay muted playsinline style="transform:none"></video><div class="big" id="cph" style="font-size:50px">📷</div></div><button class="btn pri" onclick="snap()">📸 촬영</button><p class="sm" id="cmsg"></p></div><div class="ph">${p.ph.map((x) => `<div><img src="${x}" alt="촬영 사진"></div>`).join("")}</div>`;
  },
  pay() {
    const p = P(),
      d = payDraft(p),
      rows = d.items
        .map(
          (it, i) =>
            `<div class="row" style="position:relative;flex-wrap:nowrap;gap:14px;margin-top:6px"><input class="pn ul" maxlength="20" placeholder="어디서" value="${h(it.n)}" style="flex:2;min-width:0" oninput="updPay()"><input class="pa ul" type="number" inputmode="numeric" placeholder="금액" value="${h(it.a)}" style="flex:3;min-width:0;text-align:right" oninput="updPay()">${d.items.length > 1 ? `<button class="ico" style="position:absolute;right:-22px;top:50%;transform:translateY(-50%);min-width:22px;width:22px;font-size:13px;color:var(--sub);opacity:.7" onclick="delPayRow(${i})" aria-label="이 줄 삭제">✕</button>` : ""}</div>`,
        )
        .join("");
    return `<div class="pay"><div class="card"><label class="sm" style="display:flex;align-items:center;justify-content:space-between;gap:12px">결제한 사람<select id="pw" style="width:auto;min-width:140px;margin:0" onchange="updPay()">${["A", "B", "C"].map((k) => `<option value="${k}" ${d.who == k ? "selected" : ""}>${h(nm(k))}</option>`).join("")}</select></label><div id="bankInfo" class="sm" style="margin-top:8px">${bankLine(d.who)}</div>
<h3 style="display:flex;align-items:center;margin:26px 0 4px">결제 내역<button class="ico" style="font-size:24px;font-weight:500;min-width:0;padding:0 10px 0 8px;color:var(--sub);opacity:.7" onclick="addPayRow()" aria-label="결제 내역 칸 추가">+</button></h3>${rows}
<div class="row2" style="margin:30px 0 0"><span style="font-size:18px">총 결제 금액</span><b id="ptot" style="font-size:20px">${won(paySum(d.items))}</b></div>
<div class="row" style="flex-wrap:nowrap;gap:10px;margin-top:30px"><span style="flex:none;font-size:20px;line-height:1">🎁</span><input id="px" type="number" inputmode="numeric" placeholder="선심 쓰기" value="${h(d.x)}" style="margin:0" oninput="updPay()"></div></div><div class="card" id="pr">${payBox(p, d)}</div></div>`;
  },
  rec() {
    const p = P();
    if (p.st != "ended")
      return '<div class="card">술자리를 종료하면 기록 페이지가 활성화돼요.</div>';
    return recPage(p, recEdit);
  },
  arc() {
    const l = S.P.filter((p) => p.st === "ended").sort(
      (a, b) =>
        new Date(b.date + "T" + (b.time || "00:00")) -
        new Date(a.date + "T" + (a.time || "00:00")),
    );
    let last = "",
      out = "";
    l.forEach((p) => {
      const mo = p.date.slice(0, 7).replace("-", "년 ") + "월";
      if (mo !== last) {
        out += `<h2 style="margin:18px 0 4px">${mo}</h2>`;
        last = mo;
      }
      const dr = Object.entries(p.tot || {})
          .filter((x) => x[1] > 0)
          .map(([k, v]) => `<span class="chip">${h(k)} ${v}병</span>`)
          .join(""),
        m = (p.memo || "").trim().split("\n")[0],
        n = (p.ph || []).length;
      out += `<div class="card" style="cursor:pointer" onclick="openRec(${p.id})"><b>${p.title ? h(p.title) + " · " : ""}${fd(p.date)} ${h(p.time)}</b> ${rdText(p) ? "· 📍 " + h(rdText(p)) : ""}${
        n
          ? `<div class="ph" style="margin-top:8px">${p.ph
              .slice(0, 3)
              .map((x) => `<div><img src="${x}" alt="사진"></div>`)
              .join("")}</div>`
          : ""
      }<div style="margin-top:6px">${dr || '<span class="sm">음주량 기록 없음</span>'}</div>${m ? `<div class="sm" style="margin-top:6px">📝 ${h(m.slice(0, 40))}</div>` : ""}</div>`;
    });
    return `${out || '<div class="card sm">종료된 술약이 아직 없어요. 술자리 종료를 누르면 이곳에 저장돼요.</div>'}`;
  },
};
const pc = (p) =>
  `<div class="card fr" onclick="go('d',${p.id})"><div><span class="chip ${ST[p.st][1]}">${ST[p.st][0]}</span></div><div><b>${fd(p.date)} ${p.time}</b><br><span class="sm">제안 ${h(nm(p.by))}</span></div><span>›</span></div>`;
function calc(t, x) {
  t = Math.max(0, +t || 0);
  x = Math.max(0, Math.min(+x || 0, t));
  const share = t - x,
    b = Math.floor(share / 3),
    remainder = share - b * 3;
  return { b, pay: b + x + remainder, o: b, x, remainder, share };
}
function payHTML(a, r) {
  a.done = a.done || {};
  a.done[a.who] = true;
  const others = ["A", "B", "C"].filter((k) => k !== a.who);
  return `<div class="payline" style="padding-top:0">${chipU(a.who)} <span>선심 ${won(r.x)} + N빵 ${won(r.b)}</span><button class="btn sm grn" disabled>완료 ✓</button></div>${others.map((k) => `<div class="payline">${chipU(k)} <span>${won(r.o)} 보내기</span><button class="btn sm ${a.done[k] ? "grn" : ""}" onclick="togglePaid('${k}')">${a.done[k] ? "완료 ✓" : "완료"}</button></div>`).join("")}`;
}
// 정산 입력 중인 값 (저장 전). 화면이 다시 그려져도 입력이 사라지지 않게 따로 들고 있어요
const paySum = (items) =>
  Math.round(items.reduce((t, x) => t + Math.max(0, +x.a || 0), 0));
const bankLine = (who) =>
  S.users[who].bank
    ? `입금 계좌: <b>${h(S.users[who].bank)}</b>`
    : "선택한 사람의 계좌번호가 등록되지 않았어요.";
function payDraft(p) {
  const sig = JSON.stringify(p.pay || null);
  // 내가 고치는 중이 아니면, 결제한 사람이 저장한 새 내용을 그대로 따라가요
  if (!PD || PD.id !== p.id || (!PD.dirty && PD.sig !== sig)) {
    const a = p.pay || {};
    PD = {
      id: p.id,
      sig,
      dirty: false,
      who: a.who || S.me,
      x: a.x || "",
      items:
        Array.isArray(a.items) && a.items.length
          ? a.items.map((i) => ({ n: i.n || "", a: i.a || "" }))
          : [{ n: "", a: a.t || "" }],
    };
  }
  return PD;
}
function payBox(p, d) {
  const sp = p.pay,
    a = {
      t: paySum(d.items),
      who: d.who,
      x: d.x,
      done: { ...(sp && sp.who === d.who ? sp.done : {}) },
    };
  return payHTML(a, calc(a.t, a.x));
}
function readPay() {
  const d = PD;
  if (!d) return null;
  d.who = $("pw").value;
  d.x = $("px").value;
  document.querySelectorAll("#app .pn").forEach((el, i) => d.items[i] && (d.items[i].n = el.value));
  document.querySelectorAll("#app .pa").forEach((el, i) => d.items[i] && (d.items[i].a = el.value));
  return d;
}
function updPay() {
  const d = readPay();
  if (!d) return;
  d.dirty = true;
  $("ptot").textContent = won(paySum(d.items));
  $("pr").innerHTML = payBox(P(), d);
  $("bankInfo").innerHTML = bankLine(d.who);
  payLater();
}
function addPayRow() {
  const d = readPay();
  if (!d) return;
  d.dirty = true;
  d.items.push({ n: "", a: "" });
  R();
  const el = [...document.querySelectorAll("#app .pn")].pop();
  if (el) el.focus();
}
function delPayRow(i) {
  const d = readPay();
  if (!d || d.items.length < 2) return;
  d.dirty = true;
  d.items.splice(i, 1);
  R();
  payLater();
}
let payTimer = 0;
// 정산은 입력하는 대로 자동 저장해요 (금액이 있을 때만, 입력이 잠깐 멈춘 뒤에)
function commitPay() {
  clearTimeout(payTimer);
  payTimer = 0;
  const d = PD;
  if (!d || !d.dirty) return false;
  const q = S.P.find((x) => x.id == d.id);
  if (!q) return false;
  const old = q.pay || {},
    items = d.items
      .map((i) => ({ n: String(i.n).trim(), a: String(i.a).trim() }))
      .filter((i) => i.n || i.a),
    t = paySum(items);
  if (!(t > 0)) return false;
  const a = {
    t: String(t),
    items,
    who: d.who,
    x: d.x,
    done: old.who && old.who !== d.who ? {} : { ...(old.done || {}) },
  };
  a.done[a.who] = true;
  q.pay = a;
  sv();
  d.sig = JSON.stringify(a);
  d.dirty = false;
  return true;
}
const payLater = () => {
  clearTimeout(payTimer);
  payTimer = setTimeout(commitPay, 600);
};
function togglePaid(k) {
  commitPay();
  const a = P().pay;
  if (!a) return toast("결제 내역에 금액을 입력해 주세요");
  a.done = a.done || {};
  a.done[k] = !a.done[k];
  a.done[a.who] = true;
  sv();
  R();
}
function addP() {
  const d = $("nd").value,
    t = $("nt").value;
  if (!d || !t) return toast("날짜와 시간을 모두 정해 주세요");
  const p = {
    id: Date.now(),
    by: S.me,
    date: d,
    time: t,
    votes: {},
    st: "pending",
    pl: {
      place: "",
      addr: "",
      link: "",
      menus: [],
      jam: { A: [], B: [], C: [] },
      drinks: { A: [], B: [], C: [] },
      pre: { A: "", B: "", C: "" },
      until: { A: "", B: "", C: "" },
      kr: null,
    },
    ph: [],
    tot: {},
    memo: "",
    pay: null,
  };
  S.P.push(p);
  sv();
  stopMedia();
  V = { v: "d", id: p.id };
  R();
  scrollTo(0, 0);
}
const allYes = (p) =>
  ["A", "B", "C"].every((k) => k == p.by || p.votes[k] == "y");
APP.autoConfirm = () => {
  let ch = false;
  S.P.forEach((p) => {
    if (p.st == "pending" && allYes(p)) {
      p.st = "confirmed";
      ch = true;
    }
  });
  return ch;
};
const vote = (v) =>
    upd(() => {
      const p = P();
      p.votes[S.me] = v;
      if (p.st == "pending" && allYes(p)) p.st = "confirmed";
    }),
  decide = (s) => {
    if (s === "cancelled") {
      P().st = s; // 서버에서 제안자가 바로 지워요
      sv();
      hist = [];
      V = { v: "home" };
      R();
      toast("드가지못함..");
    } else upd(() => (P().st = s));
  };
function liveTiles(p) {
  // 타일 글씨는 작고 연하게, 부가 설명 없이 이름만
  const lab = (t) => `<span style="font-size:12px;font-weight:700;opacity:.75">${t}</span>`,
    tile = (cls, bg, ico, label, on) =>
      `<button class="btn ${cls}" style="margin:0;min-height:138px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-shadow:3px 3px 0 var(--ink);${bg ? "background:" + bg + ";color:#161616;" : ""}" onclick="${on}"><span style="font-size:38px;line-height:1.1">${ico}</span>${lab(label)}</button>`,
    half = (cls, ico, label, on) =>
      `<button class="btn ${cls}" style="margin:0;flex:1;min-height:64px;display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 8px;min-width:0;overflow:hidden;box-shadow:3px 3px 0 var(--ink);${cls ? "color:#161616;" : ""}" onclick="${on}"><span style="font-size:26px;line-height:1">${ico}</span>${lab(label)}</button>`;
  return `<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-top:12px">${tile("pri", "", "📸", "사진", `go('cam',${p.id})`)}${tile("", "var(--yel)", "🍺", "만취자 기록", `openDrunk(${p.id})`)}${tile("grn", "", "💸", "정산", `go('pay',${p.id})`)}<div style="display:flex;flex-direction:column;gap:10px;min-height:138px">${half("", "📝", "술자리 계획", `go('plan',${p.id})`)}${half("", "🎤", "노래방 리스트", "T='all';go('songs')")}</div></div><div style="text-align:right;margin-top:12px"><button class="btn sm" style="margin:0" onclick="endP()">🥂 종료 🥂</button></div>`;
}
function recentSongs(n) {
  const lst = ["A", "B", "C"].flatMap((k) =>
      S.users[k].s.map((x) => ({ k, s: x })),
    ),
    has = (e) => lst.some((q) => q.k === e.k && q.s === e.s),
    log = (S.sl || []).filter(has),
    legacy = lst.filter((q) => !log.some((e) => e.k === q.k && e.s === q.s)),
    all = [...legacy, ...log].reverse(),
    seen = new Set(),
    out = [];
  for (const e of all) {
    const key = e.k + "|" + e.s;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(e);
    }
  }
  return out.slice(0, n);
}
// 목록 카드 제목 줄: 왼쪽 제목, 오른쪽에 작고 연한 '전체 보기'
const listHead = (title, on) =>
  `<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:8px"><h3 style="margin:0">${title}</h3><button onclick="${on}" style="flex:none;border:0;background:none;padding:6px 0 6px 12px;margin:-6px 0;font-size:13px;font-weight:400;font-family:inherit;color:var(--sub);cursor:pointer">전체 보기</button></div>`;
function songCard() {
  const r = recentSongs(4);
  return `<div class="card" style="margin:22px 0">${listHead("🎤 노래방 리스트 🎤", "T='all';go('songs')")}${r.map((e) => `<div class="row" style="flex-wrap:nowrap;margin:6px 0"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🎵 ${h(e.s)}</span><span style="flex:none">${chipU(e.k)}</span></div>`).join("") || '<p class="sm">아직 등록된 곡이 없어요. 프로필에서 추가해 보세요</p>'}</div>`;
}
function addSong(k) {
  const el = $("profileSong"),
    v = el && el.value.trim();
  if (!v) return;
  if (S.users[k].s.some((x) => x.toLowerCase() == v.toLowerCase()))
    return toast("이미 등록된 곡이에요");
  upd(() => {
    S.users[k].s.push(v);
    (S.sl = S.sl || []).push({ k, s: v, at: Date.now() });
  });
}
let recEdit = false;
function openRec(id) {
  recEdit = false;
  go("rec", id);
}
const rdText = (p) =>
  (p.rounds || (p.pl && p.pl.place ? [{ place: p.pl.place }] : []))
    .map((x) => x.place)
    .filter(Boolean)
    .join(" → ");
function recPage(p, ed) {
  const l = p.pl || {},
    ks = ["A", "B", "C"],
    tt = Object.entries(p.tot || {}).filter((x) => x[1] > 0),
    dw = DN[new Date(p.date + "T00:00").getDay()],
    ph = p.ph || [];
  const strip = `<div class="ps">${ph.map((x, i) => `<div class="pt"><img src="${x}" alt="사진">${ed ? `<button class="dk x" onclick="upd(()=>P().ph.splice(${i},1))" aria-label="사진 삭제">×</button>` : ""}</div>`).join("")}${ed ? `<label class="pt add2">＋ 사진 추가<input type="file" accept="image/*" multiple hidden onchange="gal(this.files)"></label>` : ph.length ? "" : '<div class="pt add2">사진 없음</div>'}</div>`;
  const head = `<div class="bx"><div class="row2"><div class="tt">${ed ? `<input class="dki" value="${h(p.title)}" maxlength="30" placeholder="제목" oninput="P().title=this.value;sv()">` : h(p.title) || '<span class="s2">제목 없음</span>'}</div><div class="s2">${p.date.replace(/-/g, ".")} (${dw})</div></div>${ed ? `<textarea class="memo" rows="5" placeholder="셋이 함께 쓰는 기록 내용" oninput="P().memo=this.value;sv()">${h(p.memo)}</textarea>` : `<div class="memo">${h(p.memo) || '<span class="s2">아직 적은 내용이 없어요. ‘기록 수정’에서 적어 보세요.</span>'}</div>`}</div>`;
  const dr = `<div class="bx"><div class="dl">주종 · 병 수</div>${ed ? [...new Set([...DR, ...Object.keys(p.tot || {})])].map((d) => `<div class="sr"><span>${h(d)}</span><button class="dk" onclick="tot('${d}',-1)" aria-label="${h(d)} 줄이기">−</button><b>${(p.tot || {})[d] || 0}</b><button class="dk" onclick="tot('${d}',1)" aria-label="${h(d)} 늘리기">＋</button></div>`).join("") + `<div class="sr"><input id="tn" class="dki" placeholder="직접 입력" style="min-width:0"><button class="dk" onclick="addT()" aria-label="추가">＋</button></div>` : tt.map(([k, v]) => `<div>${h(k)} <b>${v}병</b></div>`).join("") || '<span class="s2">기록 없음</span>'}</div>`;
  if (!p.rounds)
    p.rounds = l.place ? [{ place: l.place, addr: l.addr || "" }] : [];
  const rd = ed
    ? p.rounds
        .map(
          (r, i) =>
            `<div style="margin:6px 0"><div class="row2"><b>${i + 1}차</b><button class="dk" style="min-width:32px;min-height:32px;padding:0" onclick="upd(()=>P().rounds.splice(${i},1))" aria-label="${i + 1}차 삭제">×</button></div><input class="dki" style="width:100%;margin:2px 0" value="${h(r.place)}" placeholder="장소명" oninput="P().rounds[${i}].place=this.value;sv()"><div>${S.fav.map((f, j) => `<button class="dk" style="min-height:30px;margin:3px 3px 0 0;font-size:15px" onclick="pickRound(${i},${j})">${h(f.n)}</button>`).join("")}</div></div>`,
        )
        .join("") +
      `<button class="dk" onclick="upd(()=>P().rounds.push({place:'',addr:''}))">＋ ${p.rounds.length + 1}차 추가</button>`
    : p.rounds
        .map((r, i) =>
          r.place
            ? `<div>${i + 1}차 📍 <span class="ov">${h(r.place)}</span>${r.addr ? '<div class="s2">' + h(r.addr) + "</div>" : ""}</div>`
            : "",
        )
        .join("") || '<span class="s2">미입력</span>';
  if (p.kr === undefined) p.kr = l.kr == null ? null : l.kr;
  const kr = ed
    ? `<button class="dk ${p.kr === true ? "on" : ""}" onclick="upd(()=>P().kr=true)">드감</button> <button class="dk ${p.kr === false ? "on" : ""}" onclick="upd(()=>P().kr=false)">안드감</button>`
    : "🎤 " + (p.kr === true ? "드감" : p.kr === false ? "안드감" : "미정");
  const side = `<div class="bx"><div class="dl">장소</div>${rd}<div class="dl">노래방</div>${kr}</div>`;
  const pay = `<div class="bx"><div class="dl">정산 금액</div>${p.pay && p.pay.t ? `<div class="tt">${won(p.pay.t)}</div>${payHTML(p.pay, calc(p.pay.t, p.pay.x))}` : '<span class="s2">정산 전이에요</span>'}${ed ? `<div><button class="dk" onclick="go('pay',${p.id})">정산 입력·수정</button></div>` : ""}</div>`;
  const dkBox = p.drunk
    ? `<div class="bx"><div class="dl">🍺 오늘의 만취자</div><div class="pt" style="width:62%"><img src="${p.drunk.img}" alt="오늘의 만취자"></div>${ed ? `<div style="margin-top:8px"><button class="dk" onclick="openDrunk(${p.id})">다시 찍기</button> <button class="dk" onclick="upd(()=>delete P().drunk)">삭제</button></div>` : ""}</div>`
    : ed
      ? `<div class="bx"><div class="dl">🍺 오늘의 만취자</div><button class="dk" onclick="openDrunk(${p.id})">만취자 사진 남기기</button></div>`
      : "";
  return `<div class="dy2">${strip}${head}${dkBox}<div class="g2c">${dr}${side}</div>${pay}</div>
<button class="btn ${ed ? "grn" : "pri"}" onclick="recEdit=${!ed};R();scrollTo(0,0)">${ed ? "저장하기" : "✏️ 기록 수정"}</button>`;
}
function ask(msg, ok) {
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML =
    '<div class="card"><p style="margin:0 0 6px;font-weight:800">' +
    h(msg) +
    '</p><div class="row"><button class="btn" id="ask0">취소</button><button class="btn pri" id="ask1">확인</button></div></div>';
  document.body.append(m);
  m.querySelector("#ask0").onclick = () => m.remove();
  m.querySelector("#ask1").onclick = () => {
    m.remove();
    ok();
  };
}
function endP() {
  const p = P();
  if (!p) return toast("술약 정보를 찾을 수 없어요");
  ask("술자리를 종료하고 이 술자리의 기록 화면으로 이동할까요?", () => {
    const q = S.P.find((x) => x.id === p.id);
    if (!q) return;
    q.st = "ended";
    q.endedAt = new Date().toISOString();
    sv();
    stopMedia();
    hist = [
      ["home", undefined],
      ["arc", undefined],
    ];
    recEdit = true;
    V = { v: "rec", id: p.id };
    R();
    scrollTo(0, 0);
  });
}
function favCard(full) {
  const all = S.fav.map((f, i) => ({ f, i })),
    vis = full ? all : all.slice(-4);
  return `<div class="card"${full ? "" : ' style="margin:22px 0"'}>${full ? "<h3>⭐ 술집 리스트 ⭐</h3>" : listHead("⭐ 술집 리스트 ⭐", "go('favs')")}${vis.map(({ f, i }) => `<div class="row" style="margin:6px 0"><span style="flex:4">${/^https?:\/\//.test(f.link || "") ? `📍 <a href="${h(f.link)}" target="_blank" rel="noopener" style="color:#2a5bd7;text-decoration:none">${h(f.n)}</a>` : "📍 " + h(f.n)}</span><button class="ico" style="flex:none;min-width:34px;min-height:34px;margin:0 -6px 0 0;font-size:15px;color:var(--sub);opacity:.7" onclick="delFav(${i})" aria-label="${h(f.n)} 삭제">✕</button></div>`).join("") || ""}<div class="row"><input id="fn" placeholder="이름" style="flex:2"><input id="fl" placeholder="지도 링크(선택)" style="flex:3"></div><button class="btn" onclick="addFav()">⭐ 추가 ⭐</button></div>`;
}
function readFav() {
  const n = $("fn").value.trim(),
    l = $("fl").value.trim();
  if (!n) {
    toast("이름을 입력해 주세요");
    return null;
  }
  if (l && !/^https?:\/\//.test(l)) {
    toast("링크는 https://로 시작해야 해요");
    return null;
  }
  return { n, link: l };
}
function addFav() {
  const f = readFav();
  if (!f) return;
  if (S.fav.some((x) => x.n === f.n)) return toast("이미 등록된 곳이에요");
  upd(() => S.fav.push(f));
}
function addFavPick() {
  const f = readFav();
  if (!f) return;
  upd(() => {
    if (!S.fav.some((x) => x.n === f.n)) S.fav.push(f);
    const l = P().pl;
    l.place = f.n;
    l.link = f.link;
    l.addr = "";
  });
}
function delFav(i) {
  upd(() => S.fav.splice(i, 1));
}
function pickPlace(i) {
  const f = S.fav[i];
  upd(() => {
    const l = P().pl;
    l.place = f.n;
    l.link = f.link || "";
    l.addr = "";
  });
}
function pickRound(i, j) {
  upd(() => {
    P().rounds[i].place = S.fav[j].n;
  });
}
function pl(path, val) {
  const l = P().pl,
    [a, b] = path.split(".");
  b ? (l[a][b] = val) : (l[a] = val);
  sv();
  R();
}
// 잼얘리스트: 사람마다 자기 칸(pl.jam.A/B/C)에만 적어서 동시에 고쳐도 서로 덮어쓰지 않아요
const JAM_MIN = 1;
const jamOf = (p) => {
  const j = (p && p.pl && p.pl.jam) || {};
  return ["A", "B", "C"].flatMap((k) =>
    (Array.isArray(j[k]) ? j[k] : []).map((t, i) => ({ k, t, i })),
  );
};
const jamOk = (p) => jamOf(p).length >= JAM_MIN;
function addJam() {
  const v = $("jn").value.trim();
  if (!v) return;
  const key = (x) => x.replace(/\s+/g, "");
  if (jamOf(P()).some((x) => key(x.t) === key(v))) return;
  upd(() => {
    const l = P().pl;
    l.jam = l.jam || {};
    (l.jam[S.me] = Array.isArray(l.jam[S.me]) ? l.jam[S.me] : []).push(v);
  });
}
function delJam(i) {
  upd(() => P().pl.jam[S.me].splice(i, 1));
}
function addM() {
  const v = $("mn").value.trim();
  if (!v) return;
  const l = P().pl.menus;
  if (l.some((m) => m.n == v)) return toast("이미 있는 메뉴예요");
  upd(() => l.push({ n: v, v: [] }));
}
function addD() {
  const v = $("dn").value.trim();
  if (!v) return;
  upd(() => {
    const a = P().pl.drinks[S.me];
    a.includes(v) || a.push(v);
  });
}
function addS() {
  const v = $("sg").value.trim();
  if (!v) return;
  if (me().s.some((s) => s.toLowerCase() == v.toLowerCase()))
    return toast("이미 등록된 곡이에요");
  upd(() => {
    me().s.push(v);
    (S.sl = S.sl || []).push({ k: S.me, s: v, at: Date.now() });
  });
}
function editSchedule(k) {
  if (k !== S.me) return;
  scheduleDraft = datesOf(S.users[k].v).slice();
  scheduleEditing = true;
  R();
}
function toggleScheduleDate(date) {
  if (!scheduleEditing) return;
  const i = scheduleDraft.indexOf(date);
  if (i >= 0) scheduleDraft.splice(i, 1);
  else scheduleDraft.push(date);
  scheduleDraft.sort();
  R();
}
function saveSchedule(k) {
  if (k !== S.me) return;
  S.users[k].v = scheduleDraft.slice();
  scheduleEditing = false;
  sv();
  R();
  toast("일정 저장 완료!");
}
function tot(d, n) {
  upd(() => {
    const t = (P().tot = P().tot || {});
    t[d] = Math.max(0, (t[d] || 0) + n);
  });
}
function addT() {
  const v = $("tn").value.trim();
  if (v) tot(v, 1);
}
function shrink(src, cb) {
  const i = new Image();
  i.onload = () => {
    const w = Math.min(360, i.width),
      c = document.createElement("canvas");
    c.width = w;
    c.height = (i.height * w) / i.width;
    c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
    cb(c.toDataURL("image/jpeg", 0.7));
  };
  i.src = src;
}
function gal(fs) {
  [...fs].forEach((f) => {
    const r = new FileReader();
    r.onload = () => shrink(r.result, (u) => upd(() => P().ph.push(u)));
    r.readAsDataURL(f);
  });
}
// ───── 손 인식 (MediaPipe Hand Landmarker) : 술자리 시작(V 별) / 오늘의 만취자(검지) ─────
const MP_VER = "0.10.14",
  MP_WASM =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@" + MP_VER + "/wasm",
  MP_MODEL =
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  V_MIN = 4, // 별에 필요한 V 손 개수 (2명 양손 + 1명 한 손 = 5. 엄격하게 하려면 5로)
  STAR_R = 4.5, // V 손들이 모여 있다고 보는 거리 (손 크기의 배수). 인식이 안 되면 올리세요
  START_HOLD = 1000, // 별을 이 시간(ms) 유지해야 시작
  POINT_HOLD = 600; // 검지를 이 시간(ms) 유지해야 촬영 시작
let hl = null,
  hlPromise = null,
  hRun = 0,
  hLast = 0,
  HS = { since: 0, last: 0, busy: 0 },
  DRK = { ph: "aim", img: null };
const dst = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function fingerState(lm) {
  const size = dst(lm[0], lm[9]) || 1e-6,
    ext = (t, p) => dst(lm[0], lm[t]) > dst(lm[0], lm[p]) * 1.12;
  return { size, i: ext(8, 6), m: ext(12, 10), r: ext(16, 14), p: ext(20, 18) };
}
function isV(lm) {
  const f = fingerState(lm);
  return f.i && f.m && !f.r && !f.p && dst(lm[8], lm[12]) > f.size * 0.35;
}
function isPoint(lm) {
  const f = fingerState(lm);
  return f.i && !f.m && !f.r && !f.p;
}
function starOk(hands) {
  const v = hands.filter(isV);
  if (v.length < V_MIN) return { n: v.length, ok: false };
  const c = v.map((lm) => ({
      x: (lm[0].x + lm[9].x) / 2,
      y: (lm[0].y + lm[9].y) / 2,
      s: dst(lm[0], lm[9]),
    })),
    cx = c.reduce((a, b) => a + b.x, 0) / c.length,
    cy = c.reduce((a, b) => a + b.y, 0) / c.length,
    sz = c.reduce((a, b) => a + b.s, 0) / c.length;
  return {
    n: v.length,
    ok: c.every((q) => Math.hypot(q.x - cx, q.y - cy) < sz * STAR_R),
  };
}
function starPts() {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 17 : 42,
      a = (Math.PI / 5) * i - Math.PI / 2;
    p.push(
      (50 + r * Math.cos(a)).toFixed(1) +
        "," +
        (50 + r * Math.sin(a)).toFixed(1),
    );
  }
  return p.join(" ");
}
async function loadHL() {
  if (hl) return hl;
  if (!hlPromise)
    hlPromise = (async () => {
      const { FilesetResolver, HandLandmarker } = await import(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@" +
          MP_VER +
          "/+esm"
      );
      const files = await FilesetResolver.forVisionTasks(MP_WASM),
        mk = (d) =>
          HandLandmarker.createFromOptions(files, {
            baseOptions: { modelAssetPath: MP_MODEL, delegate: d },
            runningMode: "VIDEO",
            numHands: 6,
            minHandDetectionConfidence: 0.4,
            minHandPresenceConfidence: 0.4,
            minTrackingConfidence: 0.4,
          });
      try {
        return await mk("GPU");
      } catch (e) {
        return await mk("CPU");
      }
    })();
  try {
    hl = await hlPromise;
  } catch (e) {
    hlPromise = null;
    throw e;
  }
  return hl;
}
const hStat = (t, pct) => {
  const e = $("hs"),
    b = $("hb");
  if (e) e.textContent = t;
  if (b && pct != null) b.style.width = Math.round(pct * 100) + "%";
};
async function startHandCam(vid, screen) {
  const run = ++hRun;
  stopMedia();
  HS = { since: 0, last: 0, busy: HS.busy };
  try {
    stream2 = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
  } catch (e) {
    return hStat("카메라를 쓸 수 없어요. 권한을 확인해주세요");
  }
  const v = $(vid);
  if (!v || run !== hRun) {
    stream2 && stream2.getTracks().forEach((t) => t.stop());
    stream2 = null;
    return;
  }
  v.srcObject = stream2;
  hStat("로딩 중…");
  try {
    await loadHL();
  } catch (e) {
    console.error("HandLandmarker load error", e);
    return hStat(
      "인터넷 연결을 확인해주세요",
    );
  }
  hStat(screen === "start" ? "🌟" : "검지를 세워 보여주세요", 0);
  handLoop(run, screen, vid);
}
function handLoop(run, screen, vid) {
  if (run !== hRun || V.v !== screen || !hl) return;
  const v = $(vid),
    now = performance.now();
  if (v && now - hLast >= 100 && v.readyState >= 2 && v.videoWidth) {
    hLast = now;
    try {
      handStep(screen, hl.detectForVideo(v, now).landmarks || []);
    } catch (e) {
      console.warn("hand detect failed", e);
    }
  }
  requestAnimationFrame(() => handLoop(run, screen, vid));
}
function handStep(screen, lms) {
  if (HS.busy) return;
  const t = Date.now();
  if (screen === "start") {
    const r = starOk(lms);
    if (r.ok) {
      if (!HS.since) HS.since = t;
      HS.last = t;
    } else if (t - HS.last > 300) HS.since = 0;
    const pr = HS.since ? Math.min(1, (t - HS.since) / START_HOLD) : 0;
    hStat(
      "✌️ " +
        r.n +
        "/" +
        V_MIN +
        " 인식" +
        (r.ok ? "!🌟!" : r.n >= V_MIN ? " · 더 가까이 모아 주세요" : ""),
      pr,
    );
    if (pr >= 1) startLive();
  } else if (screen === "drunk" && DRK.ph === "aim") {
    const pt = lms.some(isPoint);
    if (pt) {
      if (!HS.since) HS.since = t;
      HS.last = t;
    } else if (t - HS.last > 250) HS.since = 0;
    const pr = HS.since ? Math.min(1, (t - HS.since) / POINT_HOLD) : 0;
    hStat(pt ? "☝️" : "☝️🥴☝️ 만취자를 찔러보세요", pr);
    if (pr >= 1) {
      HS.since = 0;
      capture();
    }
  }
}
function openStart(id) {
  HS = { since: 0, last: 0, busy: 0 };
  go("start", id);
}
function startLive() {
  const p = P();
  if (!p || p.st !== "confirmed" || HS.busy) return;
  HS.busy = 1;
  hRun++;
  stopMedia();
  const e = document.createElement("div");
  e.className = "pop";
  e.textContent = "! 짠 !";
  document.body.append(e);
  setTimeout(() => {
    e.remove();
    const q = S.P.find((x) => x.id === p.id);
    if (q) {
      q.st = "live";
      q.startedAt = new Date().toISOString();
    }
    sv();
    HS.busy = 0;
    back();
  }, 800);
}
function openDrunk(id) {
  DRK = { ph: "aim", img: null };
  HS = { since: 0, last: 0, busy: 0 };
  go("drunk", id);
}
function capture() {
  if (V.v !== "drunk" || DRK.ph !== "aim") return;
  DRK.ph = "done";
  const p = P(),
    v = $("dv"),
    c = document.createElement("canvas");
  if (stream2 && v && v.videoWidth) {
    c.width = Math.min(480, v.videoWidth);
    c.height = Math.round((v.videoHeight * c.width) / v.videoWidth);
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
  } else {
    c.width = 480;
    c.height = 360;
    const x = c.getContext("2d");
    x.fillStyle = "#f6b73c";
    x.fillRect(0, 0, 480, 360);
    x.font = "150px serif";
    x.textAlign = "center";
    x.fillText("🥴", 240, 230);
  }
  hRun++;
  stopMedia();
  if (!p) return;
  p.drunk = {
    img: c.toDataURL("image/jpeg", 0.7),
    at: new Date().toISOString(),
  };
  sv();
  toast("저장 완료!");
  back();
}
async function startCam() {
  try {
    stream2 = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    $("cv").srcObject = stream2;
    $("cph").style.display = "none";
  } catch (e) {
    $("cmsg").textContent =
      "카메라를 쓸 수 없어요. 브라우저 권한을 확인해 주세요.";
  }
}
function snap() {
  const v = $("cv");
  if (!stream2 || !v.videoWidth)
    return toast("카메라가 아직 준비되지 않았어요");
  const c = document.createElement("canvas");
  c.width = v.videoWidth;
  c.height = v.videoHeight;
  c.getContext("2d").drawImage(v, 0, 0);
  shrink(c.toDataURL(), (u) => {
    P().ph.push(u);
    sv();
    const g = document.querySelector(".ph");
    R();
    toast("저장 완료!");
  });
}
function fake() {
  const c = document.createElement("canvas");
  c.width = c.height = 360;
  const x = c.getContext("2d");
  x.fillStyle = ["#fd6f75", "#6ecb7c", "#f6b73c"][P().ph.length % 3];
  x.fillRect(0, 0, 360, 360);
  x.font = "160px serif";
  x.textAlign = "center";
  x.fillText(["🍻", "🍶", "🥂"][P().ph.length % 3], 180, 230);
  P().ph.push(c.toDataURL("image/jpeg", 0.7));
  sv();
  R();
}
// ───── 손동작 인식 (MediaPipe 손 관절 · 학습 없이 모양과 각도를 계산) ─────
// 엄지와 검지를 뻗은 L자 손을 잠깐 유지하다가, 손목 스냅으로 방향이 확 바뀌면(눕혔다 세우기) 인식해요.
// 왼손·오른손, 시작 각도, 돌리는 방향은 상관없어요.
const L_ROT = 60, // 이 각도(°) 이상 확 돌아가야 인식. 인식이 안 되면 내리고, 엉뚱하게 잡히면 올리세요
  L_STEADY = 25, // 기준 자세로 보는 흔들림 범위(°)
  L_THUMB = 0.45, // 엄지를 얼마나 펴야 L자로 보는지 (손 크기 대비). 인식이 안 되면 내리세요
  L_SEQ_MS = 2500, // 기준 자세를 마지막으로 본 뒤 이 시간 안에 돌려야 해요
  L_N = 2; // 같은 상태가 연속 몇 번 나와야 인정하는지
let lRun = 0,
  lRef = null,
  lRefAt = 0,
  lCand = null,
  lCandN = 0,
  lMoveN = 0,
  lLast = 0;
function lIsL(lm) {
  // 검지와 엄지는 펴고 나머지 세 손가락은 접은 손
  const f = fingerState(lm);
  return f.i && !f.m && !f.r && !f.p && dst(lm[4], lm[5]) >= f.size * L_THUMB;
}
const lAngle = (lm) =>
  (Math.atan2(lm[8].y - lm[5].y, lm[8].x - lm[5].x) * 180) / Math.PI; // 검지가 가리키는 방향
const lDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180); // 두 방향의 차이(0~180°)
// 영상 비율이 정사각형이 아니어도 각도가 틀어지지 않게 픽셀 좌표로 바꿔요
const lPx = (lms, v) =>
  lms.map((lm) =>
    lm.map((p) => ({ x: p.x * v.videoWidth, y: p.y * v.videoHeight, z: p.z })),
  );
function lStep(lms) {
  const now = Date.now();
  let ang = null;
  for (const lm of lms)
    if (lIsL(lm)) {
      ang = lAngle(lm);
      break;
    }
  if (lRef !== null && now - lRefAt > L_SEQ_MS) lRef = null;
  let d = 0;
  if (ang === null) lCandN = 0; // 손이 잠깐 안 보여도(스냅 순간 흐려짐) 기준 자세는 시간 안에서는 유지
  else if (lRef === null) {
    // 기준 자세 잡기: 비슷한 각도로 연속 N번
    if (lCand !== null && lDiff(ang, lCand) <= L_STEADY) {
      if (++lCandN >= L_N) {
        lRef = ang;
        lRefAt = now;
        lMoveN = 0;
      }
    } else {
      lCand = ang;
      lCandN = 1;
    }
  } else {
    d = lDiff(ang, lRef);
    if (d <= L_STEADY) {
      lRef = ang;
      lRefAt = now;
      lMoveN = 0;
    } else if (d >= L_ROT) {
      if (++lMoveN >= L_N) {
        G = now;
        lRef = lCand = null;
        lCandN = lMoveN = 0;
      }
    } else lMoveN = 0;
  }
  const g = $("gd");
  if (g)
    g.textContent =
      ang === null
        ? "엄지와 검지를 뻗은 L자 손을 보여 주세요"
        : lRef === null
          ? ""
          : "손목을 꺾어 돌려보세요!";
}
async function startL() {
  const run = ++lRun;
  try {
    await loadHL();
  } catch (e) {
    console.error("HandLandmarker load error", e);
    return toast("인터넷 연결을 확인해주세요");
  }
  if (run !== lRun) return;
  lRef = lCand = null;
  lCandN = lMoveN = 0;
  lLoop(run);
}
function lLoop(run) {
  if (run !== lRun || !M || V.v !== "home" || !hl) return;
  const v = $("cam"),
    now = performance.now();
  if (v && now - lLast >= 100 && v.readyState >= 2 && v.videoWidth) {
    lLast = now;
    try {
      lStep(lPx(hl.detectForVideo(v, now).landmarks || [], v));
    } catch (e) {
      console.warn("hand detect failed", e);
    }
  }
  requestAnimationFrame(() => lLoop(run));
}
async function startMedia() {
  try {
    M = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch (e) {
    try {
      M = await navigator.mediaDevices.getUserMedia({ audio: true });
      toast("카메라를 시작하지 못했어요");
    } catch (e2) {
      return toast("카메라·마이크 권한을 허용해 주세요");
    }
  }
  if (M.getVideoTracks().length) {
    const v = $("cam");
    let started = false;
    const go2 = () => {
      if (!started) {
        started = true;
        startL();
      }
    };
    v.srcObject = M;
    v.parentElement.classList.add("on");
    v.onloadeddata = go2;
    if (v.readyState >= 2) go2();
  } else toast("카메라·마이크 권한을 허용해 주세요");
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume().catch(() => {}); // 아이폰은 마이크가 잠들어 있을 수 있어요
    const an = AC.createAnalyser();
    an.fftSize = 1024;
    AC.createMediaStreamSource(M).connect(an);
    const buf = new Float32Array(1024),
      ctx = AC,
      warm = Date.now() + 1000; // 처음 1초는 주변 소리 크기를 익히는 시간이라 인식하지 않아요
    (function lp() {
      if (AC !== ctx) return;
      an.getFloatTimeDomainData(buf);
      let pk = 0;
      for (const x of buf) pk = Math.max(pk, Math.abs(x));
      const n = Date.now();
      const thr = Math.max(SND_PEAK, base * SND_RATIO);
      LV = Math.max(LV * 0.92, pk / thr); // 1(=100%)을 넘으면 '똑!'으로 인식해요
      if (pk > thr && n > warm && n - lastHit > 500) {
        lastHit = n;
        SD = n;
      } else base = base * 0.97 + Math.min(pk, 0.3) * 0.03;
      requestAnimationFrame(lp);
    })();
  } catch (e) {
    toast("마이크를 시작하지 못했어요");
  }
}
// '똑!' 소리 민감도: 인식이 안 되면 SND_PEAK를 내리고, 말소리에 반응하면 올리세요
// (SND_PEAK = 최소 소리 크기, SND_RATIO = 주변 소리보다 몇 배 커야 하는지)
const SND_PEAK = 0.03,
  SND_RATIO = 3;
document.addEventListener("pointerdown", () => {
  if (AC && AC.state === "suspended") AC.resume().catch(() => {});
});
function tick() {
  if (V.v != "home" || !$("cg")) return;
  if (AC && AC.state === "suspended") AC.resume().catch(() => {});
  const n = Date.now(),
    g = n - G < 4000,
    s = n - SD < 4000;
  $("cg").className = "chip " + (g ? "ok" : "");
  $("cg").textContent = "👆 제스처";
  $("cs").className = "chip " + (s ? "ok" : "");
  $("cs").textContent =
    "🔊 ‘똑!’" +
    (!s && AC && AC.state === "suspended"
      ? " 마이크 깨우는 중 · 화면을 탭하세요"
      : "");
  if (g && s) fire();
}
setInterval(tick, 200);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) commitPay();
});
addEventListener("pagehide", commitPay);
function fire() {
  if (firing) return;
  firing = 1;
  G = SD = 0;
  const e = document.createElement("div");
  e.className = "pop";
  e.textContent = "! 짠 !";
  document.body.append(e);
  setTimeout(() => {
    e.remove();
    firing = 0;
    go("new");
  }, 800);
}
// ───── 로그인·동기화 연결 (fb.js / sync.js가 사용) ─────
// 로그인 전에는 화면을 그리지 않아요. 로그인 후 fb.js가 render()를 불러요.
APP.getS = () => S;
APP.setS = (x) => {
  S = x;
};
APP.mk = mk;
APP.render = () => R();
APP.view = () => V.v;
APP.toast = (m) => toast(m);
APP.reset = () => {
  hist = [];
  V = { v: "home" };
};
APP.logout = null;
