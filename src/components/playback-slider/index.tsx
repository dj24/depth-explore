import * as React from "react";
import { Slider } from "@base-ui-components/react/slider";
import styles from "./index.module.css";

export const PlaybackSlider = () => {
  return (
    <Slider.Root className={styles.Root} defaultValue={25}>
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
};
