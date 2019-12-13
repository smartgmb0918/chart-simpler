const form = document.querySelector('#form-0');
const name = document.querySelector('#name');
const cost = document.querySelector('#cost');
const error = document.querySelector('#error-0');

form.addEventListener('submit', e => {
  e.preventDefault();

  if (name.value && cost.value) {
    const item = {
      name: name.value,
      cost: parseInt(cost.value)
    };

    db.collection('expenses').add(item).then(res => {
      error.textContent = '';
      name.value = '';
      cost.value = '';
    })
  } else {
    error.textContent = 'Please enter values before submitting';
  }
});

const content2 = document.querySelector('.content-2');
const btns = content2.querySelectorAll('button');
const form1 = content2.querySelector('form');
const formAct = content2.querySelector('form span');
const input = content2.querySelector('input');
const error1 = content2.querySelector('.error');

let activity = 'cycling';

btns.forEach(btn => {
  btn.addEventListener('click', e => {
    // get activity
    activity = e.target.dataset.activity;

    // remove and add active class
    btns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // set id of input field
    input.setAttribute('id', activity);

    // set text of form span
    formAct.textContent = activity;

    updateActivities(dataActivities); 
  })
});

// form submit
form1.addEventListener('submit', e => {
  // prevent default action
  e.preventDefault();

  const distance = parseInt(input.value);
  if (distance) {
    db.collection('activities').add({
      distance,
      activity,
      date: new Date().toString()
    }).then(() => {
      error1.textContent = '';
      input.value = '';
    });
  } else {
    error1.textContent = 'Please enter a valid distance';
  }
});
