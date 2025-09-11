document.addEventListener('DOMContentLoaded', function() {

  const deleteButtons = document.querySelectorAll('.delete-btn');
  const modal = document.getElementById('deleteModal');
  const modalItemName = document.getElementById('modalItemName');
  const modalEntityType = document.getElementById('modalEntityType');
  const deleteForm = document.getElementById('deleteForm');
  const cancelBtn = document.getElementById('cancelDelete');


  if (!modal) return;

  deleteButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault(); 
      
      const form = this.closest('.delete-form');
      
      const itemName = form.getAttribute('data-item-name');
      const entityType = form.getAttribute('data-entity-type');
      const formAction = form.getAttribute('action');
      
      modalItemName.textContent = itemName;
      modalEntityType.textContent = entityType;
      deleteForm.setAttribute('action', formAction);
      
      modal.style.display = 'flex';
    });
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      modal.style.display = 'none';
    });
  }

  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none'; 
    }
  });
});

