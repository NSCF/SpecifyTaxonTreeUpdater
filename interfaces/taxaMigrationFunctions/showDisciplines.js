module.exports = async function showDisciplines(specify) {
  try {
    var disciplines = await specify.getDisciplines()
  }
  catch(err) {
    throw(err)
  }
  
  disciplines.forEach(discipline => {
    console.log(discipline)
  });

  return

}