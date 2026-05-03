# Garmin Workout JSON Specification

**Status**: Documented from 4 real Garmin Connect exports  
**Scope**: Running workouts (pace-based)  
**Date**: February 2026

---

## Complete Workout Structure

```json
{
  "workoutName": "5x2km Intervals",
  "description": "5x2km @ 4:30/km with 2min recovery",
  "sportType": {
    "sportTypeId": 1,
    "sportTypeKey": "running"
  },
  "workoutSegments": [
    {
      "segmentOrder": 1,
      "sportType": {
        "sportTypeId": 1,
        "sportTypeKey": "running"
      },
      "workoutSteps": [
        // Individual steps go here
      ]
    }
  ]
}
```

---

## Step Types

### 1. ExecutableStepDTO (Individual Steps)

**Warmup (time-based, no target):**

```json
{
  "type": "ExecutableStepDTO",
  "stepType": {
    "stepTypeId": 1,
    "stepTypeKey": "warmup"
  },
  "endCondition": {
    "conditionTypeId": 2, // 2=time, 3=distance
    "conditionTypeKey": "time"
  },
  "endConditionValue": 600, // 10 minutes in seconds
  "targetType": {
    "workoutTargetTypeId": 1,
    "workoutTargetTypeKey": "no.target"
  },
  "targetValueOne": null,
  "targetValueTwo": 0
}
```

**Interval (distance-based with pace target):**

```json
{
  "type": "ExecutableStepDTO",
  "stepType": {
    "stepTypeId": 3,
    "stepTypeKey": "interval"
  },
  "endCondition": {
    "conditionTypeId": 3, // distance
    "conditionTypeKey": "distance",
    "endConditionValue": 2000 // 2km in meters (2000m)
  },
  "preferredEndConditionUnit": {
    "unitId": 2,
    "unitKey": "kilometer",
    "factor": 100000 // Garmin's scale factor
  },
  "targetType": {
    "workoutTargetTypeId": 6,
    "workoutTargetTypeKey": "pace.zone"
  },
  "targetValueOne": 4.5, // 4:30/km (decimal: 4 + 30/60)
  "targetValueTwo": 4.333333 // 4:20/km (range min)
}
```

**Rest (time-based with pace):**

```json
{
  "type": "ExecutableStepDTO",
  "stepType": {
    "stepTypeId": 2,
    "stepTypeKey": "rest"
  },
  "endCondition": {
    "conditionTypeId": 2,
    "conditionTypeKey": "time",
    "endConditionValue": 120 // 2 minutes
  },
  "targetType": {
    "workoutTargetTypeId": 6,
    "workoutTargetTypeKey": "pace.zone"
  },
  "targetValueOne": 6.0, // 6:00/km easy pace
  "targetValueTwo": 6.0
}
```

**Cooldown:**

```json
{
  "type": "ExecutableStepDTO",
  "stepType": {
    "stepTypeId": 5,
    "stepTypeKey": "cooldown"
  },
  "endCondition": {
    "conditionTypeId": 2,
    "conditionTypeKey": "time",
    "endConditionValue": 420 // 7 minutes
  },
  "targetType": {
    "workoutTargetTypeId": 1,
    "workoutTargetTypeKey": "no.target"
  }
}
```

---

### 2. RepeatGroupDTO (Repeating Blocks)

**From your actual Garmin export (3x7min @ 4:39/km + 2min rest):**

```json
{
  "type": "RepeatGroupDTO",
  "stepId": 12411172676,
  "stepOrder": 2,
  "stepType": {
    "stepTypeId": 6,
    "stepTypeKey": "repeat"
  },
  "numberOfIterations": 3,
  "skipLastRestStep": true, // ← CRITICAL: true to skip rest after last rep
  "smartRepeat": false,
  "endCondition": {
    "conditionTypeId": 7,
    "conditionTypeKey": "iterations" // Note: Different from steps inside
  },
  "workoutSteps": [
    {
      "type": "ExecutableStepDTO",
      "stepId": 12411172677,
      "stepOrder": 3,
      "stepType": {
        "stepTypeId": 3,
        "stepTypeKey": "interval"
      },
      "endCondition": {
        "conditionTypeId": 2,
        "conditionTypeKey": "time"
      },
      "endConditionValue": 420, // 7 minutes
      "targetType": {
        "workoutTargetTypeId": 6,
        "workoutTargetTypeKey": "pace.zone"
      },
      "targetValueOne": 3.7174721, // 3:43/km (slower bound)
      "targetValueTwo": 3.4482759 // 3:26/km (faster bound)
    },
    {
      "type": "ExecutableStepDTO",
      "stepId": 12411172678,
      "stepOrder": 4,
      "stepType": {
        "stepTypeId": 5,
        "stepTypeKey": "rest" // Note: stepTypeId 5 is REST in RepeatGroup
      },
      "endCondition": {
        "conditionTypeId": 2,
        "conditionTypeKey": "time"
      },
      "endConditionValue": 120, // 2 minutes
      "targetType": {
        "workoutTargetTypeId": 6,
        "workoutTargetTypeKey": "pace.zone"
      },
      "targetValueOne": 2.6954178, // 2:41/km (slower recovery)
      "targetValueTwo": 2.1367521 // 2:08/km (faster recovery)
    }
  ]
}
```

**What skipLastRestStep does:**

❌ **WITHOUT** `skipLastRestStep: true`:

```text
Rep 1: 2km hard + 2min easy
Rep 2: 2km hard + 2min easy
Rep 3: 2km hard + 2min easy
Rep 4: 2km hard + 2min easy
Rep 5: 2km hard + 2min easy  ← Extra break at end!
```

✅ **WITH** `skipLastRestStep: true`:

```text
Rep 1: 2km hard + 2min easy
Rep 2: 2km hard + 2min easy
Rep 3: 2km hard + 2min easy
Rep 4: 2km hard + 2min easy
Rep 5: 2km hard  ← No break after last rep
```

---

## Target Types

### Pace Target (pace.zone)

```json
"targetType": {
  "workoutTargetTypeId": 6,
  "workoutTargetTypeKey": "pace.zone"
},
"targetValueOne": 4.0,      // meters per second (faster speed = higher value)
"targetValueTwo": 3.704     // meters per second (slower speed = lower value)
```

**IMPORTANT: Values are in meters per second (m/s), NOT decimal min/km!**

**Pace Conversion:**

```text
m/s ↔ Min:Sec/km

To convert min/km → m/s:
  m/s = 1000 / (min/km_decimal × 60)

Examples:
  4:30/km → 4.5 decimal → 1000 / (4.5 × 60) = 3.704 m/s
  5:30/km → 5.5 decimal → 1000 / (5.5 × 60) = 3.030 m/s

To convert m/s → min/km:
  sec/km = 1000 / m_per_sec
  3.7174721 m/s → 1000 / 3.7174721 = 269 sec = 4:29/km
  3.030303 m/s  → 1000 / 3.030303  = 330 sec = 5:30/km

targetValueOne = faster speed (higher m/s) = faster pace (lower min/km)
targetValueTwo = slower speed (lower m/s)  = slower pace (higher min/km)
```

### No Target

```json
"targetType": {
  "workoutTargetTypeId": 1,
  "workoutTargetTypeKey": "no.target"
},
"targetValueOne": null,
"targetValueTwo": 0
```

---

## End Conditions

### By Time

```json
"endCondition": {
  "conditionTypeId": 2,
  "conditionTypeKey": "time"
},
"endConditionValue": 600  // Seconds
```

### By Distance

```json
"endCondition": {
  "conditionTypeId": 3,
  "conditionTypeKey": "distance"
},
"endConditionValue": 2000,  // Meters
"preferredEndConditionUnit": {
  "unitId": 2,
  "unitKey": "kilometer",
  "factor": 100000
}
```

---

## Complete Example Workout

**Your actual Garmin workout** (from export):

```text
10 min warmup @ 3:02-2:42/km (easy)
3x [7 min @ 3:43-3:26/km (threshold) + 2 min @ 2:41-2:08/km (recovery)]
10 min cooldown @ 3:03-2:42/km (easy)
```

Becomes (full structure):

```json
{
  "workoutName": "5x2km Intervals",
  "description": "5x2km @ 4:30/km with 2min recovery",
  "sportType": {
    "sportTypeId": 1,
    "sportTypeKey": "running"
  },
  "workoutSegments": [
    {
      "segmentOrder": 1,
      "sportType": {
        "sportTypeId": 1,
        "sportTypeKey": "running"
      },
      "workoutSteps": [
        {
          "type": "ExecutableStepDTO",
          "stepOrder": 1,
          "stepType": { "stepTypeId": 1, "stepTypeKey": "warmup" },
          "endCondition": {
            "conditionTypeId": 2,
            "conditionTypeKey": "time",
            "endConditionValue": 600
          },
          "targetType": {
            "workoutTargetTypeId": 1,
            "workoutTargetTypeKey": "no.target"
          },
          "targetValueOne": null,
          "targetValueTwo": 0
        },
        {
          "type": "RepeatGroupDTO",
          "stepOrder": 2,
          "stepType": { "stepTypeId": 6, "stepTypeKey": "repeat" },
          "numberOfIterations": 5,
          "skipLastRestStep": true,
          "workoutSteps": [
            {
              "type": "ExecutableStepDTO",
              "stepOrder": 3,
              "stepType": { "stepTypeId": 3, "stepTypeKey": "interval" },
              "endCondition": {
                "conditionTypeId": 3,
                "conditionTypeKey": "distance",
                "endConditionValue": 2000
              },
              "preferredEndConditionUnit": {
                "unitId": 2,
                "unitKey": "kilometer",
                "factor": 100000
              },
              "targetType": {
                "workoutTargetTypeId": 6,
                "workoutTargetTypeKey": "pace.zone"
              },
              "targetValueOne": 4.5,
              "targetValueTwo": 4.5
            },
            {
              "type": "ExecutableStepDTO",
              "stepOrder": 4,
              "stepType": { "stepTypeId": 2, "stepTypeKey": "rest" },
              "endCondition": {
                "conditionTypeId": 2,
                "conditionTypeKey": "time",
                "endConditionValue": 120
              },
              "targetType": {
                "workoutTargetTypeId": 6,
                "workoutTargetTypeKey": "pace.zone"
              },
              "targetValueOne": 6.0,
              "targetValueTwo": 6.0
            }
          ]
        },
        {
          "type": "ExecutableStepDTO",
          "stepOrder": 5,
          "stepType": { "stepTypeId": 5, "stepTypeKey": "cooldown" },
          "endCondition": {
            "conditionTypeId": 2,
            "conditionTypeKey": "time",
            "endConditionValue": 420
          },
          "targetType": {
            "workoutTargetTypeId": 1,
            "workoutTargetTypeKey": "no.target"
          },
          "targetValueOne": null,
          "targetValueTwo": 0
        }
      ]
    }
  ]
}
```

---

## Implementation Notes

### Minimal Required Fields

Not all fields from Garmin exports are required for creation. Minimum:

```json
{
  "workoutName": "...",
  "sportType": { "sportTypeId": 1, "sportTypeKey": "running" },
  "workoutSegments": [
    {
      "segmentOrder": 1,
      "sportType": { "sportTypeId": 1, "sportTypeKey": "running" },
      "workoutSteps": [
        // Steps
      ]
    }
  ]
}
```

### Optional Fields

These can be omitted:

- `workoutId`, `ownerId` (set by Garmin)
- `createdDate`, `updatedDate` (set by Garmin)
- `author` (set by authenticated user)
- `description` (can be empty)
- `sharedWithUsers` (can be null)

### Fields to Always Include in Steps

- `type` ("ExecutableStepDTO" or "RepeatGroupDTO")
- `stepType` (with id and key)
- `endCondition` (time or distance)
- `endConditionValue` (seconds or meters)
- `targetType` (pace or no.target)

---

## Step Type IDs Reference

From example-garmin-export.json (real Garmin Connect export):

| Name     | ID  | Key                              |
| -------- | --- | -------------------------------- |
| Warmup   | 1   | warmup                           |
| Cooldown | 2   | cooldown                         |
| Interval | 3   | interval                         |
| Other    | 4   | other                            |
| Rest     | 5   | rest (recovery in repeat blocks) |
| Repeat   | 6   | repeat                           |

---

## Sources

- 4 real workouts exported from Garmin Connect
- sydspost/Garmin-Connect-Workout-and-Schedule-creator (skipLastRestStep field)
- mkuthan/garmin-workouts (JSON format reference)

---

**Status**: Complete for running workouts  
**Tested**: Against real Garmin exports  
**Ready**: For implementation
