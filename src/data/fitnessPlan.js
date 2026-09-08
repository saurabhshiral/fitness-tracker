export const WORKOUT_PLAN = {
  0: null, // Sunday - rest
  1: {     // Monday
    name: 'Push',
    focus: 'Chest + Shoulders + Triceps',
    duration: '~45 min',
    calTarget: 1950,
    color: 'orange',
    exercises: [
      { id: 'm1', name: 'Chest press machine', sets: 4, reps: '10-12', rest: 90, priority: 1,
        alternatives: [
          { name: 'DB flat bench press', hint: 'Neutral grip, same tempo' },
          { name: 'Push-up pyramid', hint: '10-8-6-4 reps, feet elevated for last 2 sets' },
        ],
      },
      { id: 'm2', name: 'DB incline press', sets: 3, reps: '10-12', rest: 90, priority: 2,
        alternatives: [
          { name: 'Incline push-up (feet on bench)', hint: 'Same angle, 3 sets to failure' },
          { name: 'DB flat press', hint: 'Reduce rest to 60s to increase intensity' },
        ],
      },
      { id: 'm3', name: 'DB lateral raise', sets: 3, reps: '15', rest: 60, priority: 3,
        alternatives: [
          { name: 'Cable lateral raise', hint: 'Constant tension, go lighter than DBs' },
          { name: 'Resistance band lateral raise', hint: 'Use loop band anchored underfoot' },
        ],
      },
      { id: 'm4', name: 'DB seated shoulder press', sets: 3, reps: '10', rest: 90, priority: 4,
        alternatives: [
          { name: 'DB standing Arnold press', hint: 'Adds rotational component; same weight' },
          { name: 'Machine shoulder press', hint: 'Set seat so hands align with top of ears' },
        ],
      },
      { id: 'm5', name: 'DB tricep kickback', sets: 3, reps: '12', rest: 60, priority: 5, canSkip: true,
        alternatives: [
          { name: 'Diamond push-up', hint: '3 × max reps — close hand placement' },
          { name: 'DB overhead tricep extension', hint: 'Single arm; keep elbow pointed up' },
        ],
      },
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
      { id: 't1', name: 'DB bent-over row', sets: 4, reps: '10-12', rest: 90, priority: 1,
        alternatives: [
          { name: 'Machine seated row', hint: 'Neutral grip, full stretch at bottom' },
          { name: 'Cable seated row', hint: 'Use V-bar; keep chest up throughout' },
        ],
      },
      { id: 't2', name: 'DB single-arm row', sets: 3, reps: '10 each side', rest: 90, priority: 2,
        alternatives: [
          { name: 'Lat pulldown (underhand)', hint: 'Shoulder-width grip, lean back slightly' },
          { name: 'Cable single-arm row', hint: 'Same movement pattern, constant tension' },
        ],
      },
      { id: 't3', name: 'DB reverse fly', sets: 3, reps: '15', rest: 60, priority: 3,
        alternatives: [
          { name: 'Machine rear delt fly', hint: 'Set handles at shoulder height' },
          { name: 'Band pull-apart', hint: '3 × 20 — use a medium resistance band' },
        ],
      },
      { id: 't4', name: 'DB alternating bicep curl', sets: 3, reps: '12', rest: 60, priority: 4,
        alternatives: [
          { name: 'Concentration curl (seated)', hint: 'Elbow on inner thigh; squeeze hard at top' },
          { name: 'Cable curl', hint: 'Low pulley; pin elbows to sides' },
        ],
      },
      { id: 't5', name: 'Hammer curl', sets: 2, reps: '12', rest: 60, priority: 5, canSkip: true,
        alternatives: [
          { name: 'Cross-body curl', hint: 'Same neutral grip, curl toward opposite shoulder' },
          { name: 'Rope cable curl', hint: 'Neutral grip on rope at low pulley' },
        ],
      },
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
      { id: 'w1', name: 'Incline treadmill walk (6-8%)', sets: 1, reps: '25 min', rest: 0, priority: 1,
        alternatives: [
          { name: 'Stationary bike (low resistance)', hint: 'RPM 70-80, HR 120-135 bpm, same duration' },
          { name: 'Stair climber', hint: '20 min, slow pace — great LISS sub' },
        ],
      },
      { id: 'w2', name: 'Leg raise machine', sets: 3, reps: '15', rest: 60, priority: 2,
        alternatives: [
          { name: 'Hanging knee raise', hint: 'Use a pull-up bar; tuck knees to chest' },
          { name: 'Lying leg raise on bench', hint: 'Hands under lower back for support' },
        ],
      },
      { id: 'w3', name: 'DB Russian twist', sets: 3, reps: '20', rest: 60, priority: 3,
        alternatives: [
          { name: 'Bicycle crunch', hint: '3 × 20 slow reps — no neck pull' },
          { name: 'Pallof press', hint: 'Cable at chest height; 3 × 12 each side' },
        ],
      },
      { id: 'w4', name: 'Plank hold', sets: 3, reps: '30-45 sec', rest: 60, priority: 4, canSkip: true,
        alternatives: [
          { name: 'Dead bug', hint: '3 × 10 reps — lower back pressed to floor' },
          { name: 'Ab wheel rollout', hint: '3 × 8-10 reps from knees' },
        ],
      },
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
      { id: 'th1', name: 'Leg press machine', sets: 4, reps: '12', rest: 120, priority: 1,
        alternatives: [
          { name: 'DB goblet squat', hint: 'Hold one heavy DB at chest; feet shoulder-width' },
          { name: 'DB Bulgarian split squat', hint: '4 × 10 each leg; rear foot on bench' },
        ],
      },
      { id: 'th2', name: 'Leg extension machine', sets: 3, reps: '15', rest: 60, priority: 2,
        alternatives: [
          { name: 'DB step-up', hint: '3 × 12 each leg onto a bench; hold DBs at sides' },
          { name: 'Wall sit', hint: '3 × 45 sec — thighs parallel, back flat against wall' },
        ],
      },
      { id: 'th3', name: 'Leg curl machine', sets: 3, reps: '12', rest: 60, priority: 3,
        alternatives: [
          { name: 'Stability ball hamstring curl', hint: 'Lie on floor, feet on ball; curl ball in' },
          { name: 'Nordic hamstring curl (assisted)', hint: 'Partner holds ankles or use a machine bench' },
        ],
      },
      { id: 'th4', name: 'DB Romanian deadlift', sets: 3, reps: '12', rest: 90, priority: 4,
        alternatives: [
          { name: 'Bodyweight good morning', hint: '3 × 15 slow reps; hands behind head' },
          { name: 'Cable pull-through', hint: 'Rope at low pulley; hip hinge, squeeze glutes' },
        ],
      },
      { id: 'th5', name: 'DB standing calf raise', sets: 4, reps: '20', rest: 45, priority: 5, canSkip: true,
        alternatives: [
          { name: 'Seated calf raise (on bench)', hint: 'Weight on knees; full range of motion' },
          { name: 'Calf raise on leg press', hint: 'Push through balls of feet; 4 × 20' },
        ],
      },
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
      { id: 'f1', name: 'DB shoulder press', sets: 4, reps: '12', rest: 90, priority: 1,
        alternatives: [
          { name: 'Machine shoulder press', hint: 'Adjust seat so handles align with ears' },
          { name: 'Pike push-up', hint: '4 × max reps — inverted V position' },
        ],
      },
      { id: 'f2', name: 'DB flat chest fly', sets: 3, reps: '12', rest: 75, priority: 2,
        alternatives: [
          { name: 'Cable fly (crossover)', hint: 'High pulleys, meet hands at navel' },
          { name: 'Resistance band fly', hint: 'Anchor band at shoulder height; slight forward lean' },
        ],
      },
      { id: 'f3', name: 'Lateral + front raise superset', sets: 3, reps: '12 each', rest: 60, priority: 3,
        alternatives: [
          { name: 'Cable lateral raise × 15 each side', hint: 'Low pulley, cross-body — no swinging' },
          { name: 'Plate front raise', hint: 'Use a 5-10 kg plate; 3 × 15 controlled reps' },
        ],
      },
      { id: 'f4', name: 'DB overhead tricep extension', sets: 3, reps: '12', rest: 60, priority: 4, canSkip: true,
        alternatives: [
          { name: 'Tricep pushdown (cable or band)', hint: 'Overhand grip, elbows pinned to sides' },
          { name: 'Bench dip', hint: '3 × max reps; go slow on the descent' },
        ],
      },
      { id: 'f5', name: '10 min treadmill cooldown', sets: 1, reps: '10 min', rest: 0, priority: 5, canSkip: true,
        alternatives: [
          { name: 'Stationary bike cooldown', hint: 'Easy pace, HR dropping, 10 min' },
          { name: '10 min outdoor walk', hint: 'Works perfectly as a cool-down' },
        ],
      },
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
