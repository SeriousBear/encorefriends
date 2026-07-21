const GENRE_TAXONOMY = {
  "Techno": [
    "Minimal Techno", "Melodic Techno", "Hard Techno", "Industrial Techno", "Acid Techno", "Dub Techno",
    "Detroit Techno", "Peak Time Techno", "Hypnotic Techno", "Hard Groove", "Schranz", "Broken Techno",
  ],
  "House": [
    "Deep House", "Tech House", "Progressive House", "Acid House", "Afro House", "Bass House",
    "Chicago House", "Disco House", "Electro House", "French House", "Funky House", "Future House",
    "Ghetto House", "Jackin House", "Latin House", "Lo-Fi House", "Melodic House", "Microhouse",
    "Organic House", "Piano House", "Soulful House", "Tribal House", "Tropical House", "Vocal House",
  ],
  "Trance": [
    "Psytrance", "Progressive Trance", "Uplifting Trance", "Vocal Trance", "Goa Trance", "Hard Trance",
    "Tech Trance", "Full-On Psytrance", "Dark Psytrance", "Forest Psytrance", "Hi-Tech Psytrance", "Acid Trance",
  ],
  "Drum & Bass": [
    "Jungle", "Liquid DnB", "Neurofunk", "Jump Up", "Techstep", "Darkstep",
    "Halftime", "Minimal DnB", "Ragga Jungle", "Drumstep", "Rollers", "Dancefloor DnB",
  ],
  "Bass": [
    "Dubstep", "Riddim", "Brostep", "Melodic Dubstep", "Deep Dubstep", "Tearout",
    "Deathstep", "Colour Bass", "Future Bass", "Glitch Hop", "Wave", "Trap (EDM)",
    "Hybrid Trap", "Moombahton", "Jersey Club", "Baltimore Club", "Footwork", "Juke",
    "Midtempo",
  ],
  "UK Garage": [
    "2-Step", "Speed Garage", "Bassline", "Future Garage", "UK Funky", "Garage House",
    "Breakbeat", "Breaks", "Big Beat", "Nu Skool Breaks",
  ],
  "Hard Dance": [
    "Hardstyle", "Rawstyle", "Euphoric Hardstyle", "Hardcore", "Gabber", "Happy Hardcore",
    "Frenchcore", "Uptempo", "Speedcore", "Terrorcore", "Hard House", "Donk",
    "Jumpstyle", "Makina",
  ],
  "EDM": [
    "Big Room", "Mainstage", "Complextro", "Melbourne Bounce", "Slap House", "Future Rave",
  ],
  "Electronica": [
    "Ambient", "IDM", "Downtempo", "Trip-Hop", "Glitch", "Drone",
    "Electro", "Chillwave", "Chillout", "Psybient", "Psydub", "Dark Ambient",
    "Berlin School", "Leftfield", "Synthwave", "Vaporwave", "Future Funk", "New Age",
    "Lo-Fi",
  ],
  "Disco & Funk": [
    "Disco", "Nu-Disco", "Italo Disco", "Funk", "Boogie", "French Touch",
    "Hi-NRG",
  ],
  "Hip-Hop": [
    "Rap", "Trap", "Drill", "UK Drill", "Boom Bap", "Cloud Rap",
    "Grime", "Phonk", "Rage", "Plugg", "Emo Rap", "Conscious Hip-Hop",
    "Gangsta Rap", "G-Funk", "Crunk", "Hyphy", "Horrorcore", "Underground Hip-Hop",
    "East Coast Hip-Hop", "West Coast Hip-Hop", "Southern Hip-Hop", "Abstract Hip-Hop",
  ],
  "R&B & Soul": [
    "R&B", "Soul", "Neo-Soul", "Motown", "Alternative R&B", "Contemporary R&B",
    "Quiet Storm", "New Jack Swing", "Gospel", "Doo-Wop",
  ],
  "Pop": [
    "Indie Pop", "Synth-Pop", "Dream Pop", "Hyperpop", "Electropop", "Art Pop",
    "Bedroom Pop", "Dance Pop", "Power Pop", "Chamber Pop", "Baroque Pop", "Bubblegum Pop",
    "K-Pop", "J-Pop", "City Pop", "Mandopop", "Cantopop", "Europop",
  ],
  "Rock": [
    "Classic Rock", "Indie Rock", "Alternative Rock", "Psychedelic Rock", "Garage Rock", "Math Rock",
    "Post-Rock", "Prog Rock", "Stoner Rock", "Grunge", "Shoegaze", "Hard Rock",
    "Blues Rock", "Glam Rock", "Surf Rock", "Southern Rock", "Krautrock", "New Wave",
    "Noise Rock", "Art Rock", "Britpop", "Rockabilly",
  ],
  "Punk": [
    "Post-Punk", "Hardcore Punk", "Pop Punk", "Emo", "Midwest Emo", "Screamo",
    "Post-Hardcore", "Ska Punk", "Crust Punk", "Skate Punk", "Street Punk", "Oi!",
    "Egg Punk", "Folk Punk",
  ],
  "Metal": [
    "Heavy Metal", "Death Metal", "Black Metal", "Metalcore", "Deathcore", "Thrash Metal",
    "Doom Metal", "Sludge Metal", "Power Metal", "Progressive Metal", "Nu Metal", "Djent",
    "Grindcore", "Folk Metal", "Symphonic Metal", "Industrial Metal", "Melodic Death Metal",
  ],
  "Jazz": [
    "Smooth Jazz", "Bebop", "Jazz Fusion", "Swing", "Big Band", "Free Jazz",
    "Hard Bop", "Cool Jazz", "Latin Jazz", "Nu Jazz", "Jazz-Funk", "Spiritual Jazz",
    "Vocal Jazz", "Gypsy Jazz",
  ],
  "Blues": [
    "Soul Blues", "Delta Blues", "Chicago Blues", "Electric Blues", "Country Blues", "Jump Blues",
  ],
  "Folk & Country": [
    "Folk", "Indie Folk", "Singer-Songwriter", "Country", "Americana", "Bluegrass",
    "Folk Rock", "Alt-Country", "Outlaw Country", "Country Pop", "Honky Tonk", "Celtic",
    "Freak Folk", "Roots",
  ],
  "Latin": [
    "Reggaeton", "Latin Trap", "Latin Pop", "Salsa", "Cumbia", "Bachata",
    "Merengue", "Bossa Nova", "Samba", "Flamenco", "Regional Mexican", "Corridos Tumbados",
    "Banda", "Norte\u00f1o", "Mariachi", "Dembow", "Baile Funk", "Tango",
    "Tejano",
  ],
  "Caribbean": [
    "Reggae", "Dancehall", "Dub", "Ska", "Rocksteady", "Soca",
    "Calypso", "Zouk", "Kompa", "Lovers Rock",
  ],
  "African": [
    "Afrobeats", "Afrobeat", "Amapiano", "Highlife", "Gqom", "Kwaito",
    "3-Step", "Alt\u00e9", "Bongo Flava", "Soukous",
  ],
  "Classical": [
    "Opera", "Contemporary Classical", "Film Score", "Soundtrack", "Baroque", "Chamber Music",
    "Neoclassical", "Minimalism", "Choral",
  ],
  "Experimental": [
    "Noise", "Industrial", "EBM", "Darkwave", "Coldwave", "Minimal Wave",
    "Witch House", "Deconstructed Club", "Avant-Garde", "Power Electronics", "Musique Concr\u00e8te", "Sound Collage",
    "No Wave",
  ],
  "World": [
    "Spoken Word", "Klezmer", "Balkan", "Bhangra", "Bollywood", "Arabic Pop",
    "Turkish Psych", "Fado",
  ],
};
const GENRE_PARENTS = Object.keys(GENRE_TAXONOMY);
const GENRE_PARENT_OF = {};
GENRE_PARENTS.forEach((p) =>
  GENRE_TAXONOMY[p].forEach((s) => {
    GENRE_PARENT_OF[s] = p;
  }),
);
// Flat list (parents first) — used everywhere the old GENRES array was.
const GENRES = [
  ...GENRE_PARENTS,
  ...GENRE_PARENTS.flatMap((p) => GENRE_TAXONOMY[p]),
];
// All names a genre page covers: itself + its subgenres + its parent.
const genreFamily = (g) => {
  const fam = new Set([g]);
  (GENRE_TAXONOMY[g] || []).forEach((s) => fam.add(s));
  if (GENRE_PARENT_OF[g]) fam.add(GENRE_PARENT_OF[g]);
  return fam;
};
const genreHit = (tags, g) => {
  const fam = genreFamily(g);
  return (tags || []).some((t) => fam.has(t));
};
// Match strength between two users. Strongest signal first: shows you're both
// going to, shows you both attended, shared favorite artists, shared genres.
const matchInfo = (me, u2, concerts) => {
  if (!me || !u2 || u2.id === me.id || !me.id) return { score: 0, line: null };
  const both = (c) =>
    (c.attendees || []).includes(me.id) && (c.attendees || []).includes(u2.id);
  const up = concerts.filter((c) => both(c) && daysUntil(c.date) >= 0);
  const past = concerts.filter((c) => both(c) && daysUntil(c.date) < 0);
  const arts = (me.artists || []).filter((a) =>
    (u2.artists || []).includes(a),
  );
  const gens = (me.genres || []).filter((g) => (u2.genres || []).includes(g));
  const score =
    up.length * 10 + past.length * 5 + arts.length * 2 + gens.length;
  let line = null;
  if (up.length)
    line =
      up.length === 1
        ? "🎟 You're both going to " + up[0].artist
        : "🎟 " + up.length + " upcoming shows together";
  else if (past.length)
    line =
      "🤝 You were both at " +
      past[0].artist +
      (past.length > 1 ? " +" + (past.length - 1) + " more" : "");
  else if (arts.length) line = "♪ Both into " + arts.slice(0, 2).join(", ");
  else if (gens.length) line = "◈ Shared: " + gens.slice(0, 3).join(", ");
  return { score, line };
};
