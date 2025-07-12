'use client'

import {createContext, use, useEffect} from 'react';
import {assign, setup} from "xstate";
import {useMachine} from "@xstate/react";
import {match, P} from "ts-pattern";
import {RawImage} from '@huggingface/transformers';

const workerPromise: Promise<Worker> = new Promise(resolve => {
  const worker = new Worker(new URL('../workers/worker.js', import.meta.url), {type: 'module'});
  worker.postMessage({type: 'ping'});
  worker.addEventListener('message', (event) => {
    if (event.data.type === 'pong') {
      resolve(worker);
    }
  });
});


type WorkerStartEvent = { type: 'start'; dataUrl: string };
type WorkerFinishEvent = { type: 'finish'; rawImage: RawImage };
type WorkerEvent = WorkerStartEvent | WorkerFinishEvent
type WorkerContext = {
  dataUrl: string | null;
  rawImage: RawImage | null;
}

const WorkerContext = createContext<{ send: (event: WorkerEvent) => void } | null>(null);

const workerMachine = setup({
  types: {
    events: {} as WorkerEvent
  },
  actions: {
    start: () => {
    },
    finish: () => {
    }
  }
}).createMachine({
  id: 'worker',
  initial: 'idle',
  states: {
    idle: {
      on: {
        start: {
          target: 'processing',
          actions: 'start',
        },
      },
    },
    processing: {
      on: {
        finish: {
          target: 'idle',
          actions: 'finish',
        },
      },
    },
  },
})

export const WorkerProvider = ({children}: { children: React.ReactNode }) => {
  const worker = use(workerPromise);

  const [, send] = useMachine(workerMachine.provide({
    actions: {
      start: assign({
        dataUrl: ({event}) => {
          if (event.type !== 'start' || !event.dataUrl) {
            throw new Error('Invalid event type or missing dataUrl');
          }
          console.log('Sending dataUrl to worker:', event.dataUrl);
          worker.postMessage({type: 'depth', data: event.dataUrl});
          return event.dataUrl
        }
      })
      ,
      finish: assign({
        rawImage: ({event}) => {
          if (event.type !== 'finish' || !event.rawImage) {
            throw new Error('Invalid event type or missing rawImage');
          }
          console.log('Received rawImage from worker:', event.rawImage);
          return event.rawImage
        }
      })
    }
  }));

  worker.addEventListener('message', (event: MessageEvent<any>) => {
    match(event.data)
      .with({type: 'ping'}, () => {
        worker.postMessage({type: 'pong'});
      })
      .with({type: 'pong'}, () => {
        console.log('Worker is ready');
      })
      .with({type: 'depth_result'}, () => {
        const {data} = event;
        const depthImage = new RawImage(data.data, data.width, data.height, data.channels)
        send({type: 'finish', rawImage: depthImage});
      })
      .with({type: 'error'}, (error) => {
        console.error('Worker error:', error);
      })
      .with({type: P.string}, (data) => {
        console.warn(`Unknown message type: ${data.type}`);
      });
  });

  return (
    <WorkerContext.Provider value={{send}}>
      {children}
    </WorkerContext.Provider>
  );
}

export const useWorkerContext = () => {
  const value = use(WorkerContext);

  if (!value) {
    throw new Error('Worker context is not available. Make sure to wrap your component tree with WorkerContextProvider.');
  }

  return value;
}