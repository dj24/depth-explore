import * as React from "react";
import { Slider } from "@base-ui-components/react/slider";
import styles from "./index.module.css";
import { ComponentProps } from "react";

export const PlaybackSlider = (
  props: Omit<ComponentProps<typeof Slider.Root>, "className">,
) => {
  return (
    <Slider.Root className={styles.Root} {...props}>
      <Slider.Control className={styles.Control}>
        <Slider.Track className={styles.Track}>
          <Slider.Indicator className={styles.Indicator} />
          <Slider.Thumb className={styles.Thumb} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
};
