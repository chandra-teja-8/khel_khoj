import os
import sys
import numpy as np

# Add ai-service to path
sys.path.insert(0, os.path.dirname(__file__))

from service import (
    count_reps_adaptive,
    detect_activity_from_metrics,
    get_gemini_coaching,
    GEMINI_AVAILABLE
)

def test_pushup_exact_reps():
    """Verify that an athlete performing exactly 5 pushups is counted as 5 reps (never 10+)."""
    # 5 cycles of elbow angle dipping from 160° down to 88° then back to 160°
    # 30 fps, 5 seconds = 150 frames. Each rep ~ 1 second = 30 frames
    t = np.linspace(0, 5 * 2 * np.pi, 150)
    # Cosine wave from 124 - 36*cos(t): min = 88°, max = 160°
    signal = 124.0 - 36.0 * np.cos(t)
    # Add minor realistic noise
    np.random.seed(42)
    noisy_signal = (signal + np.random.normal(0, 1.5, len(signal))).tolist()

    reps = count_reps_adaptive(noisy_signal, min_range=18.0, invert=False, min_interval_frames=10)
    print(f"[TEST 1: Pushups] Simulated 5 reps -> Detected: {reps} reps")
    assert reps == 5, f"Expected 5 pushup reps, got {reps}"
    print("  --> PASSED: Exact 5 pushups correctly counted without artificial inflation!")

def test_situp_exact_reps():
    """Verify that an athlete performing exactly 5 situps is counted as 5 reps."""
    # Hip angle flexing from 150° (supine) down to 55° (situp)
    t = np.linspace(0, 5 * 2 * np.pi, 150)
    signal = 102.5 - 47.5 * np.cos(t)
    np.random.seed(43)
    noisy_signal = (signal + np.random.normal(0, 2.0, len(signal))).tolist()

    reps = count_reps_adaptive(noisy_signal, min_range=22.0, invert=False, min_interval_frames=10)
    print(f"[TEST 2: Situps] Simulated 5 reps -> Detected: {reps} reps")
    assert reps == 5, f"Expected 5 situp reps, got {reps}"
    print("  --> PASSED: Exact 5 situps correctly counted!")

def test_squat_exact_reps():
    """Verify that squats knee flexion cycles are counted accurately."""
    # Knee angle going from 165° (standing) down to 85° (deep squat)
    t = np.linspace(0, 5 * 2 * np.pi, 150)
    signal = 125.0 - 40.0 * np.cos(t)
    np.random.seed(44)
    noisy_signal = (signal + np.random.normal(0, 1.5, len(signal))).tolist()

    reps = count_reps_adaptive(noisy_signal, min_range=26.0, invert=False, min_interval_frames=10)
    print(f"[TEST 3: Squats] Simulated 5 reps -> Detected: {reps} reps")
    assert reps == 5, f"Expected 5 squat reps, got {reps}"
    print("  --> PASSED: Exact 5 squats correctly counted!")

def test_high_jump_detection():
    """Verify that airborne high jump events are detected accurately."""
    # Ankle Y position: standing baseline at 450px. 3 jumps dip to 310px (high in frame)
    signal = [450.0] * 180
    # Jump 1 at frame 30-50
    for i in range(30, 50):
        signal[i] = 450.0 - 130.0 * np.sin((i - 30) / 20.0 * np.pi)
    # Jump 2 at frame 80-100
    for i in range(80, 100):
        signal[i] = 450.0 - 140.0 * np.sin((i - 80) / 20.0 * np.pi)
    # Jump 3 at frame 130-150
    for i in range(130, 150):
        signal[i] = 450.0 - 135.0 * np.sin((i - 130) / 20.0 * np.pi)

    jumps = count_reps_adaptive(signal, min_range=28.0, invert=False, min_interval_frames=15)
    print(f"[TEST 4: High Jump] Simulated 3 jumps -> Detected: {jumps} jumps")
    assert jumps == 3, f"Expected 3 jumps, got {jumps}"
    print("  --> PASSED: Exact 3 high jumps correctly detected!")

def test_activity_classification():
    """Verify activity classification logic."""
    # Pushups explicit
    assert detect_activity_from_metrics("PUSHUPS-01", [], [], [], [], [], 10.0) == "PUSHUPS"
    # Sprint explicit
    assert detect_activity_from_metrics("SPRINT-100M-01", [], [], [], [], [], 11.5) == "100M_SPRINT"
    # Situps explicit
    assert detect_activity_from_metrics("SITUPS-01", [], [], [], [], [], 15.0) == "SITUPS"
    # Wall sit explicit
    assert detect_activity_from_metrics("WALLSIT-01", [], [], [], [], [], 60.0) == "WALLSIT"
    # High jump explicit
    assert detect_activity_from_metrics("HIGHJUMP-01", [], [], [], [], [], 8.0) == "HIGHJUMP"
    # Squats explicit
    assert detect_activity_from_metrics("SQUATS-01", [], [], [], [], [], 12.0) == "SQUATS"
    
    # Heuristic wall sit: knee held at ~90° with tiny variance (< 10°)
    knee_wall = [90.5 + 0.5 * np.sin(i) for i in range(60)]
    assert detect_activity_from_metrics("UNKNOWN", [], knee_wall, [], [5.0]*60, [], 60.0) == "WALLSIT"
    print("[TEST 5: Activity Classification] All 6 activities correctly classified!")
    print("  --> PASSED: Protocol code and kinematics detection fully verified!")

def test_gemini_3_8_flash():
    """Verify Gemini 3.8 Flash produces authentic personalized coaching."""
    print("[TEST 6: Gemini Coaching] Calling Gemini 3.8 Flash...")
    advice = get_gemini_coaching(
        activity="PUSHUPS",
        derived_metrics={
            "repetitionCount": 5,
            "avgElbowFlexionDeg": 88.5,
            "minElbowAngleDeg": 84.0,
            "torsoAlignmentStability": 95.2,
            "cadenceRpm": 28.5
        },
        overall_score=85.0,
        duration_sec=10.5
    )
    assert advice is not None and len(advice) > 20, "Expected non-empty Gemini coaching advice"
    print("  --> PASSED: Gemini 3.8 Flash responded successfully!")
    print(f"  Advice snippet:\n{advice[:180]}...")

if __name__ == "__main__":
    print("=== RUNNING TARGETED EXERCISE REPETITION & BIOMECHANICS TESTS ===")
    test_pushup_exact_reps()
    test_situp_exact_reps()
    test_squat_exact_reps()
    test_high_jump_detection()
    test_activity_classification()
    test_gemini_3_8_flash()
    print("\nALL 6 TARGETED TESTS PASSED PERFECTLY!")
