'use client'

import {createContext, use} from 'react';
import { setup} from "xstate";
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


type WorkerMachineContext = { dataUrl: string | null, rawImage: RawImage | null };
type WorkerStartEvent = { type: 'start'; dataUrl: string };
type WorkerFinishEvent = { type: 'finish'; rawImage: RawImage };
type WorkerEvent = WorkerStartEvent | WorkerFinishEvent

const WorkerContext = createContext<{ send: (event: WorkerEvent) => void  } | null>(null);

// Handles worker messages
const workerMachine = setup({
  types: {
    context: {} as WorkerMachineContext,
    events: {} as WorkerEvent,
  }
}).createMachine({
  id: 'worker',
  initial: 'idle',
  context: {
    dataUrl: null,
    rawImage: null
  },
  states: {
    idle: {
      on: {
        start: {
          target: 'processing',
          actions: () => {
            console.log('worker started')
          }
        }
      }
    },
    processing: {
      on: {
        finish: {
          target: 'idle',
          actions: () => {
            console.log('worker finished processing');
          }
        },
      }
    },
  },
})

export const WorkerProvider = ({children}: { children: React.ReactNode }) => {
  const worker = use(workerPromise);

  const [, send] = useMachine(workerMachine);

  worker.addEventListener('message', (event: MessageEvent<unknown>) => {
    match(event.data)
      .with({type: 'ping'}, () => {
        worker.postMessage({type: 'pong'});
      })
      .with({type: 'pong'}, () => {
        console.log('Worker is ready');
      })
      .with({type: 'depth_result'}, () => {
        const {data} = event;
        console.log('Received depth result:', data);
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