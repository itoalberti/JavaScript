'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    // this.date =...
    // this.id =...
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

// +++++++++++++++++++++++++ RUNNING +++++++++++++++++++++++++
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// +++++++++++++++++++++++++ CYCLING +++++++++++++++++++++++++
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// Examples:
// const run1 = new Running([39, -15], 5.2, 26, 186);
// const cycling1 = new Cycling([42, -11], 32, 84, 221);

// ######################### APPLICATION ARCHITECTURE #########################
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
// implementar
const btnDeleteAll = document.querySelector('.btn__deleteAll');
// implementar
const btnYes = document.querySelector('.btn__yes');
// implementar
const btnNo = document.querySelector('.btn__no');
// implementar
const alertMessage = document.querySelector('.alert__delete');

class App {
  #map;
  #zoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Gets user's position
    this._getPosition();
    // Gets data from local storage
    this._getLocalStorage();

    // Add the new workout
    form.addEventListener('submit', this._newWorkout.bind(this));
    // Swaps workout type if cycling ←→ running
    inputType.addEventListener('change', this._toggleElevationField);
    // Moves pointer to the workout position when clicked
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    // Button - Delete workout
    const btnDelete = document.querySelectorAll('.workout__delete');
    btnDelete.forEach((btn) => btn.addEventListener('click', this._deleteWorkout.bind(this)));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        // In case location is provided:
        this._loadMap.bind(this),
        // In case location is not provided:
        function () {
          alert('Mapty could not get your current position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    console.log(`https://www.google.com.br/maps/place/${latitude},${longitude}`);

    //   leaflet code:
    this.#map = L.map('map').setView(coords, this.#zoomLevel); //   setView(coordinates, zoom level)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // 'on' is an event created by the leaflet library
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Hide form and clear input fields
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const allNumbers = (...inputs) =>
      // every: function checks if every 'inp' satisfies the condition. If yes, returns true. If not, false.
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => Number(inp) > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout is running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid
      // prettier-ignore
      if (!allNumbers(distance, duration, cadence) || !allPositive(distance, duration, cadence))
        return alert('All inputs must be positive numbers');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout is cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (!allNumbers(distance, duration, elevation) || !allPositive(distance, duration)) return alert('All inputs must be positive numbers');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as a marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input data
    this._hideForm();

    // Creates a local storage for all workouts
    this._setLocalStorage();

    // this.reset();

    // Display marker
    console.log(this.#mapEvent);
  }

  _renderWorkoutMarker(workout) {
    // creates marker from the coordinates
    L.marker(workout.coords, { riseOnHover: true })
      .addTo(this.#map) // adds marker to the map
      // creates a pop-up and binds it to the marker
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
      .openPopup(); // opens the pop-up
  }

  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <button class="workout__delete">❌</button>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (workout.type === 'running')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>`;

    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰️</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
     </div>
    `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    if (!this.#map) return;

    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workouts.find((work) => work.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, this.#zoomLevel, { animate: true, pan: { duration: 0.5 } });
    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  // implementar deleteAllWorkouts
  _deleteAllWorkouts() {
    // implementar renderAlert
    this._renderAlert();
  }

  // implementar deleteWorkout
  _deleteWorkout() {
    // implementar renderAlert
    this._renderAlert();
  }

  // implementar rrenderAlert
  _renderAlert() {}

  // Render the delete workout alert
  _renderAlert() {
    // Add alert message and remove the clear all button
    alertMessage.classList.add(`alert--deletion--active`);
    btnClear.style.display = `none`;
    // If btn-Negative, remove the alert and add back the Clear All btn.
    btnNegative.addEventListener(`click`, () => {
      alertMessage.classList.remove(`alert--deletion--active`);
      btnClear.style.display = `unset`;
      return false;
    });
    btnPositive.addEventListener(`click`, () => {
      alertMessage.classList.remove(`alert--deletion--active`);
      btnClear.style.display = `unset`;
      return true;
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
