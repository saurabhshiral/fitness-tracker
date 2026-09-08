export const WORKOUT_PLAN = {
  0: null, // Sunday - rest
  1: {     // Monday
    name: 'Push',
    focus: 'Chest + Shoulders + Triceps',
    duration: '~45 min',
    calTarget: 1950,
    color: 'orange',
    exercises: [
      { id: 'm1', name: 'Chest press machine', sets: 4, reps: '10-12', rest: 90, priority: 1 },
      { id: 'm2', name: 'DB incline press', sets: 3, reps: '10-12', rest: 90, priority: 2 },
      { id: 'm3', name: 'DB lateral raise', sets: 3, reps: '15', rest: 60, priority: 3 },
      { id: 'm4', name: 'DB seated shoulder press', sets: 3, reps: '10', rest: 90, priority: 4 },
      { id: 'm5', name: 'DB tricep kickback', sets: 3, reps: '12', rest: 60, priority: 5, canSkip: true },
    ],
    tip: 'Skip #5 if short on time',
  },
  2: {     // Tuesday
    name: 'Pull',
    focus: 'Back + Biceps',
    duration: '~45 min',
    calTarget: 1950,
    color: 'blue',
    exercises: [
      { id: 't1', name: 'DB bent-over row', sets: 4, reps: '10-12', rest: 90, priority: 1 },
      { id: 't2', name: 'DB single-arm row', sets: 3, reps: '10 each side', rest: 90, priority: 2 },
      { id: 't3', name: 'DB reverse fly', sets: 3, reps: '15', rest: 60, priority: 3 },
      { id: 't4', name: 'DB alternating bicep curl', sets: 3, reps: '12', rest: 60, priority: 4 },
      { id: 't5', name: 'Hammer curl', sets: 2, reps: '12', rest: 60, priority: 5, canSkip: true },
    ],
    tip: 'Never skip #1 & #2 — fixes shoulder rounding',
  },
  3: {     // Wednesday
    name: 'Cardio + Core',
    focus: 'Cardio + Core',
    duration: '~40 min',
    calTarget: 1850,
    color: 'green',
    exercises: [
      { id: 'w1', name: 'Incline treadmill walk (6-8%)', sets: 1, reps: '25 min', rest: 0, priority: 1 },
      { id: 'w2', name: 'Leg raise machine', sets: 3, reps: '15', rest: 60, priority: 2 },
      { id: 'w3', name: 'DB Russian twist', sets: 3, reps: '20', rest: 60, priority: 3 },
      { id: 'w4', name: 'Plank hold', sets: 3, reps: '30-45 sec', rest: 60, priority: 4, canSkip: true },
    ],
    tip: 'Treadmill: HR 120-135 bpm, pace 3.5 mph',
  },
  4: {     // Thursday
    name: 'Legs',
    focus: 'Quads + Hamstrings + Calves',
    duration: '~50 min',
    calTarget: 1950,
    color: 'purple',
    exercises: [
      { id: 'th1', name: 'Leg press machine', sets: 4, reps: '12', rest: 120, priority: 1 },
      { id: 'th2', name: 'Leg extension machine', sets: 3, reps: '15', rest: 60, priority: 2 },
      { id: 'th3', name: 'Leg curl machine', sets: 3, reps: '12', rest: 60, priority: 3 },
      { id: 'th4', name: 'DB Romanian deadlift', sets: 3, reps: '12', rest: 90, priority: 4 },
      { id: 'th5', name: 'DB standing calf raise', sets: 4, reps: '20', rest: 45, priority: 5, canSkip: true },
    ],
    tip: 'No barbell squat weeks 1-4. Add at week 5.',
  },
  5: {     // Friday
    name: 'Upper',
    focus: 'Shoulders + Arms Volume',
    duration: '~45 min',
    calTarget: 1950,
    color: 'yellow',
    exercises: [
      { id: 'f1', name: 'DB shoulder press', sets: 4, reps: '12', rest: 90, priority: 1 },
      { id: 'f2', name: 'DB flat chest fly', sets: 3, reps: '12', rest: 75, priority: 2 },
      { id: 'f3', name: 'Lateral + front raise superset', sets: 3, reps: '12 each', rest: 60, priority: 3 },
      { id: 'f4', name: 'DB overhead tricep extension', sets: 3, reps: '12', rest: 60, priority: 4, canSkip: true },
      { id: 'f5', name: '10 min treadmill cooldown', sets: 1, reps: '10 min', rest: 0, priority: 5, canSkip: true },
    ],
    tip: '10 min treadmill cooldown at the end',
  },
  6: null, // Saturday - rest
}

export const CALORIE_TARGETS = { workout: 1950, cardio: 1850, rest: 1750 }
export const MACRO_TARGETS = {
  workout: { protein: 150, carbs: 210, fat: 65 },
  rest:    { protein: 150, carbs: 180, fat: 60 },
}

export const STARTING_STATS = {
  date: '2026-09-07',
  weight: 66.4,
  bodyFat: 17.8,
  waist: 33.2,
  hip: 35.5,
  neck: 14.5,
  chest: 34.2,
  upperArm: 11.9,
  quadriceps: 19.0,
}

export const PROGRAM_START = '2026-09-07'
export const PROTEIN_TARGET = 150
export const STEPS_TARGET = 8000
export const WATER_TARGET_L = 3.5

export const PHASES = [
  { start: 1, end: 4, name: 'Foundation & Form', description: '3 sets only, learn movements, establish routine', color: 'green' },
  { start: 5, end: 8, name: 'Progressive Overload', description: 'Bump to 4 sets, add 1-2kg when 12 reps easy', color: 'orange' },
  { start: 9, end: 12, name: 'Intensification', description: 'Drop sets, supersets, second cardio on Saturday', color: 'red' },
]

export const COMMON_FOODS = [
  { name: 'Rolled oats (60g dry)',        cal: 220, protein: 8,  carbs: 38, fat: 4 },
  { name: 'Whole egg',                    cal: 70,  protein: 6,  carbs: 0,  fat: 5 },
  { name: 'Banana (medium)',              cal: 105, protein: 1,  carbs: 27, fat: 0 },
  { name: 'Almonds (10 pcs)',             cal: 70,  protein: 3,  carbs: 2,  fat: 6 },
  { name: 'Greek yogurt plain (150g)',    cal: 100, protein: 17, carbs: 6,  fat: 0 },
  { name: 'Paneer (100g)',                cal: 265, protein: 18, carbs: 1,  fat: 20 },
  { name: 'Dal cooked (1 katori ~150g)',  cal: 150, protein: 10, carbs: 22, fat: 2 },
  { name: 'Whole wheat chapati',          cal: 100, protein: 3,  carbs: 20, fat: 1 },
  { name: 'Whey protein (1 scoop)',       cal: 120, protein: 25, carbs: 3,  fat: 2 },
  { name: 'Egg bhurji (3 eggs)',          cal: 230, protein: 19, carbs: 2,  fat: 16 },
  { name: 'Milk full fat (250ml)',        cal: 150, protein: 8,  carbs: 12, fat: 8 },
  { name: 'Rajma/chana (100g cooked)',    cal: 130, protein: 9,  carbs: 22, fat: 1 },
  { name: 'White rice (80g cooked)',      cal: 100, protein: 2,  carbs: 22, fat: 0 },
  { name: 'Dates (3 pcs)',               cal: 70,  protein: 0,  carbs: 18, fat: 0 },
  { name: 'Dark chocolate (1 square)',    cal: 50,  protein: 1,  carbs: 5,  fat: 3 },
  { name: 'Roasted chana (40g)',          cal: 140, protein: 9,  carbs: 19, fat: 3 },
  { name: 'Tofu firm (100g)',             cal: 76,  protein: 8,  carbs: 2,  fat: 4 },
  { name: 'Cottage cheese (100g)',        cal: 98,  protein: 11, carbs: 3,  fat: 4 },
]
