// Primera vez en el juego, adopciones nuevas y despedida de una mascota.

import { L, fill } from '../dialogos.js';
import { portrait } from '../retrato.js';
import { T, esc } from '../textos.js';

function speciesCard(game, species, onPick) {
  const card = document.createElement('button');

  card.type = 'button';
  card.className = 'adopt-card';
  card.innerHTML = `
    <span class="adopt-card-art"></span>
    <strong>${esc(L(species.name))}</strong>
    <span class="adopt-card-trait">${esc(L(species.personality))}</span>
  `;
  card.querySelector('.adopt-card-art').append(portrait({ species: species.id }, game.catalog, { label: L(species.name) }));
  card.addEventListener('click', () => onPick(species));
  return card;
}

// Formulario de nombre y color de una especie
export function adoptionForm(root, game, species, { price = 0, onBack } = {}) {
  let variant = 0;
  const legacyName = game.state.legacy?.name;
  const suggested = legacyName && legacyName !== 'Mi Pet' ? legacyName : L(species.name);
  const colors = [species.palette, ...(species.variants ?? [])];

  root.innerHTML = `
    <div class="adopt-form">
      <div class="adopt-preview"></div>
      <h2 class="pixel-title">${esc(L(species.name))}</h2>
      <p class="adopt-desc">${esc(L(species.desc))}</p>
      <p class="adopt-desc"><strong>${T('adopt.traits')}:</strong> ${esc(L(species.personality))}</p>
      ${colors.length > 1 ? `
        <div class="adopt-colors" role="group" aria-label="${T('adopt.color')}">
          ${colors.map((color, index) => `<button type="button" class="color-chip" data-variant="${index}" style="background:${color.body}" aria-label="${T('adopt.color')} ${index + 1}" aria-pressed="${index === 0}"></button>`).join('')}
        </div>` : ''}
      <form class="adopt-name">
        <label class="pet-label">${T('adopt.nameLabel')}
          <input class="pet-input" name="name" maxlength="${game.catalog.config.name.max}" required value="${esc(suggested)}">
        </label>
        <div class="adopt-actions">
          ${onBack ? `<button type="button" class="pet-button" data-back>${T('adopt.back')}</button>` : ''}
          <button class="pet-button is-primary">${price ? T('col.adoptFor', { n: price }) : T('adopt.confirm')}</button>
        </div>
      </form>
    </div>
  `;

  const preview = root.querySelector('.adopt-preview');
  const paintPreview = () => preview.replaceChildren(portrait({ species: species.id, variant }, game.catalog, { pose: 'happy', label: L(species.name) }));

  paintPreview();
  root.querySelectorAll('[data-variant]').forEach((chip) => {
    chip.addEventListener('click', () => {
      variant = Number(chip.dataset.variant);
      root.querySelectorAll('[data-variant]').forEach((other) => other.setAttribute('aria-pressed', String(other === chip)));
      paintPreview();
    });
  });
  root.querySelector('[data-back]')?.addEventListener('click', onBack);
  root.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = new FormData(event.target).get('name');
    const result = await game.act('adopt', { species: species.id, name, variant }, { silent: true });

    if (result) {
      document.querySelector('.pet-overlay')?.remove();
      game.viewName = 'home';
      game.route([]);
    }
  });
}

function chooseStep(root, game) {
  // Solo lo que se puede adoptar gratis: las demás especies se compran desde la colección
  const starters = game.catalog.species.filter((species) => {
    const status = game.state.speciesStatus.find(({ id }) => id === species.id);
    return status.unlocked && !status.price;
  });

  root.innerHTML = `
    <div class="adopt">
      <h2 class="pixel-title">${T('adopt.choose')}</h2>
      <div class="adopt-grid"></div>
    </div>
  `;
  const grid = root.querySelector('.adopt-grid');

  starters.forEach((species) => grid.append(speciesCard(game, species, (picked) => {
    adoptionForm(root, game, picked, { onBack: () => chooseStep(root, game) });
  })));
}

export function showAdoption(root, game) {
  root.innerHTML = `
    <div class="adopt adopt-intro">
      <h2 class="pixel-title">${T('adopt.title')}</h2>
      <p>${T('adopt.intro1')}</p>
      <p>${T('adopt.intro2')}</p>
      <button type="button" class="pet-button is-primary" id="adopt-next">${T('adopt.next')}</button>
    </div>
  `;
  root.querySelector('#adopt-next').addEventListener('click', () => chooseStep(root, game));
}

export function showFuneral(root, game) {
  const { pendingFuneral: pet } = game.state;
  const epitaph = fill(L(game.catalog.epitaphs[pet.epitaph]), { pet: pet.name });

  root.innerHTML = `
    <div class="adopt adopt-intro funeral">
      <h2 class="pixel-title">${T('adopt.funeral')}</h2>
      <div class="adopt-preview"></div>
      <p>${esc(epitaph)}</p>
      <p>${esc(T('adopt.funeralText', { pet: pet.name }))}</p>
      <button type="button" class="pet-button is-primary" id="funeral-next">${T('adopt.continue')}</button>
    </div>
  `;
  root.querySelector('.adopt-preview').append(portrait(pet, game.catalog, { pose: 'sleeping', still: true, label: pet.name }));
  root.querySelector('#funeral-next').addEventListener('click', async () => {
    const result = await game.act('ackFuneral', {}, { silent: true });
    if (result) game.route([]);
  });
}
