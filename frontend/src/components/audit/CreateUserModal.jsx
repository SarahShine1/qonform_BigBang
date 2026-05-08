import SharedCreateUserModal from "../users/CreateUserModal";

export default function CreateUserModal({ isOpen, onClose }) {
  return <SharedCreateUserModal open={isOpen} onClose={onClose} />;
}
