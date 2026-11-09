/* Photography. Unsplash IDs (unsplash.com/license), hotlinked through
   images.unsplash.com. Every ID below was fetched on 9 Nov 2026 (HTTP 200)
   and looked at on a contact sheet for subject before being kept. People
   are stock models standing in for fictional Edera users; no real person
   is presented as a customer. */

export const photo = (id: string, w = 800, extra = '') =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop${extra}`

const UNSPLASH = {
  /* events: celebrations */
  weddingBalloons: '1511285560929-80b456fea0bc', // couple under a cloud of balloons, guests behind (hero)
  weddingConfetti: '1583939003579-730e3918a45a', // bride and groom kissing, bridesmaids in blue throwing confetti
  weddingGlasses: '1527529482837-4698179dc6ce', // guests raising champagne under string lights at a reception
  tipiDance: '1482575832494-771f74bf6857', // guests dancing inside a tipi marquee with bunting
  rooftopParty: '1517457373958-b7bdd4587205', // evening crowd under string lights
  dinnerLaugh: '1528605248644-14dd04022da1', // friends laughing around a long dinner table
  confettiCrowd: '1514525253161-7a46d19cd819', // crowd under confetti and light
  confettiBlue: '1505236858219-8359eb29e329', // blue confetti bursting over a crowd
  confettiPop: '1513151233558-d860c5398176', // confetti against a teal sky
  sparklerCrowd: '1492684223066-81342ee5ff30', // purple confetti over a dark crowd
  fireworks: '1567593810070-7a3d471af022', // fireworks over a crowd
  fireworksRed: '1560986752-2e31d9507413', // red and gold fireworks filling the sky
  birthdayCake: '1464349153735-7db50ed83c84', // birthday cake with lit letter candles
  balloons: '1530103862676-de8c9debad1d', // bright metallic balloons
  pinkies: '1593526613712-7b4b9a707330', // two hands with linked little fingers
  ringsFlowers: '1515934751635-c81c6bc9a2d8', // wedding rings on pale roses
  ringsHands: '1465495976277-4387d4b0b4c6', // couple's hands with rings and a bouquet
  coupleHill: '1532712938310-34cb3982ef74', // couple walking on a hill at dusk
  mrMrs: '1507504031003-b417219a0fde', // wooden "Mr & Mrs" sign
  /* venues */
  barnDrapes: '1510076857177-7470076d4098', // barn hall dressed in white drapes and warm lights
  ballroom: '1519167758481-83f550bb49b3', // banquet hall, round tables, chandeliers
  glassHall: '1546195643-70f48f9c5b87', // glasshouse venue with tables under greenery
  communityHall: '1523580494863-6f3031224c94', // hall with guests seated facing a stage
  brightHall: '1531058020387-3be344556be6', // crowd in a bright white hall with tall windows
  conferenceRoom: '1511578314322-379afb476865', // conference room with screens
  lawnChairs: '1522673607200-164d1b6ce486', // bride and groom chairs on a lawn
  lakeTerrace: '1559339352-11d035aa65de', // terrace restaurant by a lake
  modernDining: '1517248135467-4c7edcad34c4', // modern restaurant interior, timber
  barLights: '1543007630-9710e4a00a20', // bar with hanging bulbs
  stringBulbs: '1464047736614-af63643285bf', // string of warm bulbs
  /* vendors: music */
  djClub: '1496337589254-7e19d01cec44', // DJ at the decks, club crowd and mirror ball
  djMixer: '1470225620780-dba8ba36b745', // hand on a lit DJ mixer
  danceFloor: '1574391884720-bbc3740c59d1', // dance floor silhouettes in blue light
  studioGuitars: '1598488035139-bdbb2231ce04', // studio with guitars on the wall
  micStage: '1516280440614-37939bbacd81', // microphone on a dark stage
  micBlue: '1507676184212-d03ab07a01bf', // microphone in blue concert light
  concertYellow: '1459749411175-04bf5292ceea', // crowd hands up, yellow stage light
  concertCrowd: '1501281668745-f7f57925c3b4', // crowd filming a stage
  concertLights: '1516450360452-9312f5e86fc7', // stage lights over a crowd
  /* vendors: food and cake */
  buffetTrays: '1555244162-803834f70033', // buffet chafing dishes with rice and sides
  grillPlatter: '1555939594-58d7cb561ad1', // grilled meats and sauces from above
  platedMeat: '1504674900247-0877df9cc836', // plated meat with greens and chillies
  stewPan: '1604908176997-125f25cc6f3d', // tomato stew in a pan with herbs
  salmonPlate: '1467003909585-2f8a72700288', // plated salmon
  saladBowl: '1540189549336-e6e99c3679fe', // salad bowl
  finePlate: '1414235077428-338989a2e8c0', // fine-dining plate with wine
  canapes: '1529543544282-ea669407fca3', // canapés on a wooden board with wine
  tieredCake: '1535254973040-607b474cb50d', // white tiered wedding cake with roses
  chocolateCake: '1578985545062-69928b1d9587', // chocolate drip cake
  dripCake: '1588195538326-c5b1e9f80a1b', // white cake with chocolate drip
  sprinkleCake: '1464349095431-e9a21285b5f3', // colourful sprinkle cake, cut
  cupcakes: '1486427944299-d1955d23e34d', // teal cupcakes
  pinkCupcakes: '1563729784474-d77dbb933a9e', // pink cupcakes
  cakeSlice: '1565958011703-44f9829ba187', // cake slice with raspberries
  cocktailPour: '1470337458703-46ad1756a187', // bartender pouring a cocktail
  drinksToast: '1519671482749-fd09be7ccebf', // glasses clinking
  /* vendors: decor, flowers, photography */
  tableGreenery: '1522413452208-996ff3f3e740', // table setting with greenery and candles
  tableFlowers: '1519225421980-715cb0215aed', // long table dressed with flowers
  tableGlasses: '1511795409834-ef04bbd61622', // table set with glasses and bright flowers
  tableBunting: '1464366400600-7168b8af9bc3', // wedding table with yellow flowers and bunting
  brickFlowers: '1478146059778-26028b07395a', // flowers and champagne against a brick wall
  bouquet: '1487530811176-3780de880c2d', // bridal bouquet, roses and eucalyptus
  callaLilies: '1469259943454-aa100abba749', // pink calla lilies
  studioLights: '1471341971476-ae15ff5dd4ea', // photo studio with softboxes
  cameraHand: '1554048612-b6a482bc67e5', // hand holding a camera into the sun
  cameraBody: '1502920917128-1aa500764cbd', // DSLR on white
  suitFitting: '1594938298603-c8148c4dae35', // man in a checked suit
  /* product moments */
  qrPhone: '1595079676339-1534801ad6cf', // phone showing a QR code
  phoneTap: '1512428559087-560fa5ceab42', // a hand tapping a phone
  counterPay: '1556740758-90de374c12ad', // paying at a counter
  friendsRow: '1529156069898-49953e39b3ac', // friends in a row, arms around each other
  sunsetFriends: '1511632765486-a01980e01a18', // friends watching a sunset
  teamGrass: '1526976668912-1a811878dd37', // a team on the grass, laughing
  /* places */
  lagosWaterfront: '1618828665011-0abd973f7bb8', // Lagos waterfront from the air
  londonThames: '1513635269975-59663e0ac1ad', // the Thames and Tower Bridge from the air
  londonBigBen: '1486299267070-83823f5448dd', // Westminster and Big Ben
  londonDusk: '1529655683826-aba9b3e77383', // Westminster at dusk
  /* people (stock models for fictional users) */
  adaeze: '1531123897727-8f129e1688ce', // woman in a white collar and patterned top: Adaeze, the client
  tunde: '1506634572416-48cdfe530110', // man in a maroon sweater and glasses: Tunde, the planner
  bola: '1530785602389-07594beb8b73', // smiling woman in a headwrap: Bola, caterer and hall owner
  kayode: '1543610892-0b1f7e6d8ac1', // man in a beanie and glasses, profile: DJ Kaytee
  funmi: '1632765854612-9b02b6ec2b15', // woman with an afro: Funmi, cakes
  kemi: '1589156280159-27698a70f29e', // woman with curly hair at dusk: Kemi, decor
  seyi: '1531384441138-2736e62e0919', // man in a beret with a camera: Seyi, photographer
  chuks: '1522529599102-193c0d76b5b6', // smiling man in a grey tee: MC Chuks
  dapo: '1521119989659-a83eee488004', // man in an orange beanie: Dapo, venue manager
  dave: '1463453091185-61582044d556', // man in a striped shirt, warm smile: Dave, Edera founder
  tola: '1589156191108-c762ff4b96ab', // woman in a white puffer: Tola, gele and glam
  femi: '1480429370139-e0132c086e2a', // man in a grey double-breasted suit: Femi, cocktails
  lade: '1531901599143-df5010ab9438', // man in sunglasses: DJ Lade, Lagos
  ngoziB: '1662850886700-4ec19bd30d11', // woman with curly hair, green tee: Ngozi B., florist
  wale: '1519345182560-3f2917c472ef', // man with long curls and sunglasses: Wale, photographer
  chioma: '1502685104226-ee32379fefbe', // laughing woman with red curls: Chioma
  obi: '1506277886164-e25aa3f4ef7f', // man in a green jersey: Obi
  ife: '1566492031773-4f4e44671857', // man with glasses, striped tee: Ife
  amaka: '1508214751196-bcfd4ca60f91', // woman with soft hair at sunset: Amaka
  tomi: '1548142813-c348350df52b', // smiling woman, palms behind: Tomi
  yemi: '1524504388940-b1c1722653e1', // woman with blonde waves: Yemi
  sade: '1517841905240-472988babdf9', // woman in a grey hood and denim: Sade
  ronke: '1567532939604-b6b5b0db2604', // woman with long dark hair: Ronke
  bisi: '1580489944761-15a19d654956', // woman with hair up, white tee: Bisi
  dami: '1507003211169-0a1dd7228f2d', // man in a white tee, smiling: Dami
  kunle: '1500648767791-00dcc994a43e', // man in a grey sweater: Kunle
  adaora: '1494790108377-be9c29b29330', // laughing woman in red: Adaora
  emeka: '1472099645785-5658abf4ff4e', // older man with glasses: Emeka (the father)
  ngozi: '1573497019940-1c28c88b4f3e', // woman with curly hair and a big smile: Ngozi (the mother)
  uche: '1544723795-3fb6469f5b39', // man in a cap and yellow tee: Uche
  nneka: '1529626455594-4ff0802cfb7e', // woman with auburn hair, blue wall: Nneka
  segun: '1519085360753-af0119f7cbe7', // man in a dark suit, arms crossed: Segun
  tayo: '1552058544-f2b08422138a', // bearded man, black and white: Tayo
  zara: '1554151228-14d9def656e4', // woman with freckles, hand on cheek: Zara
  lola: '1489424731084-a5d8b219a5bb', // red-haired woman laughing: Lola
  halima: '1534528741775-53994a69daeb', // woman in blue light: Halima
  musa: '1539571696357-5a69c17a67c6', // young man in a black hat: Musa
  ayo: '1568602471122-7832951cc4c5', // man with glasses and beard: Ayo
  nkechi: '1573496359142-b8d87734a5a2', // woman in a grey blazer: Nkechi
  ola: '1599566150163-29194dcaad36', // man with glasses, white tee: Ola
  tobi: '1570295999919-56ceb5ecca61', // man in a blue sweater: Tobi
  ebuka: '1633332755192-727a05c4013d', // man with glasses, black tee: Ebuka
  grace: '1611695434369-a8f5d76ceb7b', // woman laughing, long hair: Grace
  ruth: '1623717217554-72ca676de535', // woman in a red top, smiling: Ruth
} as const

export const MEDIA = UNSPLASH
export type MediaKey = keyof typeof MEDIA

export const img = (key: MediaKey, w = 800) => photo(MEDIA[key], w)
export const face = (key: MediaKey, w = 160) => photo(MEDIA[key], w, `&h=${w}&crop=faces`)
