"use strict";

// Seoul calendar dates keep the displayed schedule consistent across devices.
function seoulDate(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const get = type => parts.find(part => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function updateStatuses() {
  const today = seoulDate(new Date());
  document.querySelectorAll(".status").forEach(badge => {
    const { start, end } = badge.dataset;
    badge.classList.remove("active", "ended");
    if (today < start) {
      badge.textContent = `${Number(start.slice(5, 7))}월 ${Number(start.slice(8))}일 시작`;
    } else if (today <= end) {
      badge.textContent = "참여 기간";
      badge.classList.add("active");
    } else {
      badge.textContent = "운영 기간 종료";
      badge.classList.add("ended");
    }
  });
  updateParticipationLinks(today);
}

function programDetails(programId) {
  const program = document.getElementById(programId);
  const { start, end } = program.querySelector(".status").dataset;
  return { start, end, name: program.querySelector("h3").textContent };
}

function participationState(programId, today) {
  const { start, end } = programDetails(programId);
  if (today < start) return "upcoming";
  return today <= end ? "active" : "ended";
}

function participationDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function updateParticipationLinks(today) {
  document.querySelectorAll("[data-participation-url]").forEach(link => {
    const programId = link.dataset.program;
    const { name, start } = programDetails(programId);
    const state = participationState(programId, today);
    const active = state === "active";
    link.classList.toggle("is-unavailable", !active);
    link.href = active ? link.dataset.participationUrl : `#${programId}`;
    link.title = active ? `${name} 참여하기 (새 창)` : state === "upcoming"
      ? `아직 행사 기간이 아닙니다. ${participationDate(start)}부터 참여할 수 있어요.`
      : `${name} 행사 기간이 종료되었습니다.`;
    link.querySelector(".sr-only").textContent = active ? " (새 창)" : " (행사 기간 안내)";
    if (active) link.setAttribute("target", "_blank");
    else link.removeAttribute("target");
  });
}

// Recheck at activation, including a tab left open across the date boundary.
document.querySelectorAll("[data-participation-url]").forEach(link => {
  const checkPeriod = event => {
    updateStatuses();
    const programId = link.dataset.program;
    const state = participationState(programId, seoulDate(new Date()));
    if (state === "active") return;
    event.preventDefault();
    const { name, start, end } = programDetails(programId);
    const period = `${participationDate(start)} ~ ${participationDate(end)}`;
    window.alert(state === "upcoming"
      ? `아직 행사 기간이 아닙니다.\n\n${name}\n참여 기간: ${period}\n안내된 기간에 참여해 주세요.`
      : `${name} 행사 기간이 종료되었습니다.\n\n참여 기간: ${period}`);
  };
  link.addEventListener("click", checkPeriod);
  link.addEventListener("auxclick", event => {
    if (event.button === 1) checkPeriod(event);
  });
});

updateStatuses();
setInterval(updateStatuses, 60000);
window.addEventListener("focus", updateStatuses);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) updateStatuses();
});

const poster = document.getElementById("poster-dialog");
const posterButton = document.getElementById("open-poster");
posterButton.addEventListener("click", () => {
  poster.showModal();
  document.body.classList.add("modal-open");
});
document.getElementById("close-poster").addEventListener("click", () => poster.close());
poster.addEventListener("click", event => {
  const box = poster.getBoundingClientRect();
  if (event.target === poster && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) poster.close();
});
poster.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  posterButton.focus();
});
