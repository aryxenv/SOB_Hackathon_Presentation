import { CollectionDeckModal } from './CollectionDeckModal';

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  return <CollectionDeckModal onClose={onClose} showProfileSummary />;
}
