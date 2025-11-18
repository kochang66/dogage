// script.js

/* 
  功能說明（概要）
  - 使用者在 <input type="date"> 選擇狗狗生日後，按「開始計算」
  - 計算狗狗年齡（以今日為基準，年為單位的小數），並用科學公式換算成人類年齡
  - 把 dogBirthday、dogAge、humanAge 儲存在 localStorage（key: dogBirthday, dogAge, humanAge）
  - 每次載入頁面（或重新整理）會自動從 localStorage 讀取（若有）並顯示
*/

/* 
  科學公式（放在程式註解中，不顯示於畫面）
  人類年齡 = 16 × ln(狗年齡) + 31

  來源（註解）:
  Wang, T. et al., Quantitative Translation of Dog-to-Human Aging by Conserved Remodeling of the DNA Methylome, Cell Systems, 2019.
 （新聞參考連結： https://www.cna.com.tw/news/firstnews/202007030292.aspx?utm_source=chatgpt.com ）
*/

(function () {
  // localStorage keys (明確命名)
  const KEY_BIRTHDAY = 'dogBirthday';
  const KEY_DOG_AGE = 'dogAge';
  const KEY_HUMAN_AGE = 'humanAge';

  // DOM elements
  const birthdayInput = document.getElementById('birthday');
  const calcBtn = document.getElementById('calcBtn');
  const resultEl = document.getElementById('result');

  // Helper: format number to one decimal place but keep as Number for storage
  function fmtOneDecimal(num) {
    return Number(Number(num).toFixed(1));
  }

  // Calculate dog's age in years (decimal) using today's date as reference
  function calculateDogAgeFromBirthday(birthDate) {
    // birthDate: a Date object (UTC/local interpreted by Date)
    const now = new Date();
    const diffMs = now - birthDate; // milliseconds
    // convert ms to years; using average Gregorian year length 365.2425 days
    const msPerYear = 365.2425 * 24 * 60 * 60 * 1000;
    const years = diffMs / msPerYear;
    return years;
  }

  // Calculate human equivalent using the scientific formula
  function calculateHumanAgeFromDogAge(dogAgeYears) {
    // If dogAgeYears <= 0, formula invalid (ln undefined). Return 0.
    if (!(dogAgeYears > 0)) return 0;
    // humanAge = 16 * ln(dogAge) + 31
    return 16 * Math.log(dogAgeYears) + 31;
  }

  // Render result in required text pattern (numbers bold)
  function renderResult(dogAge, humanAge) {
    if (!dogAge || !humanAge) {
      resultEl.innerHTML = ''; // default empty
      return;
    }

    const dogStr = `<strong>${fmtOneDecimal(dogAge)}</strong>`;
    const humanStr = `<strong>${fmtOneDecimal(humanAge)}</strong>`;

    resultEl.innerHTML = `妙麗現在大約 ${dogStr} 歲狗年齡，<br>換算成人類年齡大約是 ${humanStr} 歲。`;
  }

  // Save three values to localStorage (strings)
  function saveToLocalStorage(birthdayISO, dogAge, humanAge) {
    try {
      if (birthdayISO !== null) {
        localStorage.setItem(KEY_BIRTHDAY, birthdayISO);
      }
      if (dogAge !== null && dogAge !== undefined) {
        localStorage.setItem(KEY_DOG_AGE, String(fmtOneDecimal(dogAge)));
      }
      if (humanAge !== null && humanAge !== undefined) {
        localStorage.setItem(KEY_HUMAN_AGE, String(fmtOneDecimal(humanAge)));
      }
    } catch (e) {
      // quota or security error — fail silently but log for debugging
      // (不顯示於 UI)
      // console.warn('localStorage save failed', e);
    }
  }

  // Read stored birthday + stored ages (if exist)
  function readFromLocalStorage() {
    try {
      const birthdayISO = localStorage.getItem(KEY_BIRTHDAY);
      const storedDogAge = localStorage.getItem(KEY_DOG_AGE);
      const storedHumanAge = localStorage.getItem(KEY_HUMAN_AGE);
      return {
        birthdayISO,
        storedDogAge: storedDogAge !== null ? Number(storedDogAge) : null,
        storedHumanAge: storedHumanAge !== null ? Number(storedHumanAge) : null
      };
    } catch (e) {
      // console.warn('localStorage read failed', e);
      return { birthdayISO: null, storedDogAge: null, storedHumanAge: null };
    }
  }

  // Main compute+save flow when user clicks button (or on load)
  function computeAndSave(birthdayISO) {
    if (!birthdayISO) {
      // nothing to compute
      resultEl.innerHTML = '';
      return;
    }

    // Create Date from ISO (YYYY-MM-DD)
    const birthDate = new Date(birthdayISO + 'T00:00:00'); // ensure local midnight
    if (isNaN(birthDate.getTime())) {
      resultEl.innerHTML = '';
      return;
    }

    const rawDogAge = calculateDogAgeFromBirthday(birthDate);
    const dogAge = fmtOneDecimal(rawDogAge);
    const rawHumanAge = calculateHumanAgeFromDogAge(rawDogAge);
    const humanAge = fmtOneDecimal(rawHumanAge);

    // Save to localStorage
    saveToLocalStorage(birthdayISO, dogAge, humanAge);

    // Render on page
    renderResult(dogAge, humanAge);
  }

  // Button click handler
  calcBtn.addEventListener('click', function () {
    const birthdayISO = birthdayInput.value || null;
    if (!birthdayISO) {
      // if no date chosen, clear result and don't store
      resultEl.innerHTML = '';
      return;
    }
    // store birthday as ISO and compute+store results
    saveToLocalStorage(birthdayISO, null, null); // store birthday immediately
    computeAndSave(birthdayISO);
  });

  // On load: attempt to read stored birthday and stored ages.
  // Approach: if birthday exists -> populate input, then recompute up-to-date ages
  // and overwrite stored dogAge/humanAge (this ensures age is current as time passes).
  // This still satisfies "read from localStorage" because we read the birthday and
  // then display results (we also update stored results).
  document.addEventListener('DOMContentLoaded', function () {
    const { birthdayISO, storedDogAge, storedHumanAge } = readFromLocalStorage();

    if (birthdayISO) {
      // fill input
      birthdayInput.value = birthdayISO;

      // Option A: show previously stored results immediately (if present)
      // but then compute fresh and update storage/display to keep things current.
      if (storedDogAge !== null && storedHumanAge !== null) {
        // render stored values briefly (keeps behavior transparent)
        renderResult(storedDogAge, storedHumanAge);
      }

      // compute fresh (using today's date) and overwrite storage & display
      computeAndSave(birthdayISO);
    } else {
      // no saved birthday -> empty display
      resultEl.innerHTML = '';
    }
  });

})();