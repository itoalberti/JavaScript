'use strict';

const btn = document.querySelector('.btn-country');
const counstriesContainer = document.querySelector('.countries');

const renderCountry = function (data, className = '') {
  const languages = Object.values(data.languages)[0];
  const currencies = Object.values(data.currencies)[0].name;
  const html = `
  <article class="country ${className}">
    <img class="country__img" src="${data.flags.svg}" />
    <div class="country__data">
      <h3 class="country__name">${data.name.common}</h3>
      <h4 class="country__region">${data.region}</h4>
      <p class="country__row"><span>👫</span>${(+data.population / 1000000).toFixed(1)} millions</p>
      <p class="country__row"><span>🗣️</span>${languages}</p>
      <p class="country__row"><span>💰</span>${currencies}</p>
    </div>
</article>`;
  counstriesContainer.insertAdjacentHTML('beforeend', html);
  counstriesContainer.style.opacity = 1;
};

const getCountryAndNeighbour = function (country) {
  // AJAX call country 1
  const req = new XMLHttpRequest();
  req.open('GET', `https://restcountries.com/v3.1/name/${country}`);
  req.send();

  req.addEventListener('load', function () {
    const [data] = JSON.parse(this.responseText);
    console.log('data:', data);
    renderCountry(data);

    // Get neighbour country
    const [neighbour] = data.borders;
    console.log(`neighbour:`, neighbour);
    if (!neighbour) return;

    // AJAX call country 2
    const req2 = new XMLHttpRequest();
    req2.open('GET', `https://restcountries.com/v3.1/alpha/${neighbour}`);
    req2.send();
    req2.addEventListener('load', function () {
      const [data2] = JSON.parse(this.responseText);
      console.log('data2:', data2);
      renderCountry(data2, 'neighbour');
    });
  });
};

getCountryAndNeighbour('canada');
// getCountryAndNeighbour('bangladesh');
// getCountryAndNeighbour('mongolia');
