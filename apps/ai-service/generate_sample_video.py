import os
import cv2
import numpy as np

def create_sample_athlete_video(output_path: str, num_frames=60, fps=30):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    width, height = 640, 480
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    for i in range(num_frames):
        # Create athletic track background
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        frame[:300, :] = [180, 160, 140] # Light background
        frame[300:, :] = [40, 60, 180]  # Red athletic track running surface

        # White track lane lines
        cv2.line(frame, (0, 360), (width, 360), (255, 255, 255), 2)
        cv2.line(frame, (0, 440), (width, 440), (255, 255, 255), 2)

        # Draw moving human figure
        x = int(100 + (i / num_frames) * 440)
        y = 260
        cycle = (i % 15) / 15.0 * 2 * np.pi

        # Head
        cv2.circle(frame, (x, y - 60), 18, (220, 200, 180), -1)
        # Torso
        cv2.line(frame, (x, y - 42), (x - 6, y + 20), (30, 30, 200), 12)
        # Left Leg
        knee_x = int(x - 6 + 25 * np.sin(cycle))
        knee_y = int(y + 20 + 35)
        ankle_x = int(knee_x + 20 * np.sin(cycle + 0.5))
        ankle_y = int(knee_y + 35)
        cv2.line(frame, (x - 6, y + 20), (knee_x, knee_y), (40, 40, 40), 8)
        cv2.line(frame, (knee_x, knee_y), (ankle_x, ankle_y), (40, 40, 40), 6)

        # Right Leg
        r_knee_x = int(x - 6 - 25 * np.sin(cycle))
        r_knee_y = int(y + 20 + 35)
        r_ankle_x = int(r_knee_x - 20 * np.sin(cycle + 0.5))
        r_ankle_y = int(r_knee_y + 35)
        cv2.line(frame, (x - 6, y + 20), (r_knee_x, r_knee_y), (80, 80, 80), 8)
        cv2.line(frame, (r_knee_x, r_knee_y), (r_ankle_x, r_ankle_y), (80, 80, 80), 6)

        # Arms
        cv2.line(frame, (x, y - 35), (int(x + 20 * np.cos(cycle)), y - 10), (30, 30, 200), 6)
        cv2.line(frame, (x, y - 35), (int(x - 20 * np.cos(cycle)), y - 10), (30, 30, 200), 6)

        out.write(frame)

    out.release()
    print(f"Sample video created at: {output_path}")

if __name__ == "__main__":
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage/videos"))
    target = os.path.join(out_dir, "smoke_test.mp4")
    create_sample_athlete_video(target)
