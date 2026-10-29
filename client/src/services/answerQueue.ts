export interface PendingTestAnswer {
  questionId: string;
  selectedOptions: string[];
  isMarkedForReview: boolean;
}

// Keep the newest edit if the student changes an answer while its previous save is in flight.
// Rejected requests leave the queue intact for reconnect/reload recovery.
export async function savePendingAnswers(
  pending: Record<string, PendingTestAnswer>,
  send: (answer: PendingTestAnswer) => Promise<unknown>,
  onSaved: () => void,
): Promise<void> {
  while (Object.keys(pending).length) {
    const [key, answer] = Object.entries(pending)[0];
    await send(answer);
    if (pending[key] === answer) delete pending[key];
    onSaved();
  }
}
