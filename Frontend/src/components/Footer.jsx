

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-6 text-center text-sm">
    <p>© {new Date().getFullYear()} MindCare. All rights reserved.</p>
    <p className="mt-2">
      *MindCare is not a substitute for professional medical help. If you
      have a serious mental health condition, please seek immediate
      professional care.
    </p>
  </footer>
  )
}

export default Footer