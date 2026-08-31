
// GANTI bagian ini pake config firebase project punya sendiri
// caranya ada di firebase console > project settings > your apps
var firebaseConfig = {
  apiKey: "AIzaSyCJCq06Yu0aKSDMSaR3w0Q4WbXqaKFGSzw",
    authDomain: "popice-app.firebaseapp.com",
  projectId: "popice-app",
    storageBucket: "popice-app.firebasestorage.app",
  messagingSenderId: "945993424040",
    appId: "1:945993424040:web:76edc9a947e25ce275f69d"
}

firebase.initializeApp(firebaseConfig)

var auth = firebase.auth()
var db = firebase.firestore()

var semuaTransaksi = []

var chartTren = null
var chartProduk = null

var modalProduk = {
  "Mangga": 2000,
    "Melon": 2000,
  "Anggur": 2000,
  "Leci": 2000,
      "Strawberry": 2000,
  "Cokelat": 2500
}

var hargaProdukAdmin = {
  "Mangga": 5000,
    "Melon": 5000,
  "Anggur": 5000,
  "Leci": 5000,
      "Strawberry": 5000,
  "Cokelat": 5000
}

function ambilPesananMasuk(){

  db.collection("pesanan").orderBy("waktu", "desc").onSnapshot(function(snapshot){

    document.getElementById("cardPesanan").innerHTML = snapshot.size

    if(snapshot.empty){
        document.getElementById("pesananKosong").style.display = "block"
      document.getElementById("daftarPesananMasuk").innerHTML = ""
        return
    }

    document.getElementById("pesananKosong").style.display = "none"

    var html = ""

      snapshot.forEach(function(doc){

      var p = doc.data()
        var id = doc.id

      var namaItems = []
        for(var i=0; i<p.items.length; i++){
        namaItems.push("Popice " + p.items[i].produk + " x" + p.items[i].jumlah)
      }
        var teksItems = namaItems.join(", ")

      var badgeClass = p.status == "selesai" ? "statusbadge selesai" : "statusbadge"

      html = html + "<div class='pesanan-item'>"
        html = html + "<div class='baris-atas'><span>" + teksItems + "</span><span class='totalnya'>Rp " + p.total.toLocaleString("id-ID") + "</span></div>"
      html = html + "<span class='" + badgeClass + "'>" + p.status + "</span>"

        if(p.status != "selesai"){
        html = html + "<br><button class='konfirmbtn' onclick='konfirmasiPesanan(\"" + id + "\")'>konfirmasi jadi transaksi</button>"
      }

      html = html + "<button class='hapusbtn' onclick='hapusPesanan(\"" + id + "\")' style='margin-left:6px;'>hapus</button>"

      html = html + "</div>"

    })

    document.getElementById("daftarPesananMasuk").innerHTML = html

  })

}

function konfirmasiPesanan(id){

  db.collection("pesanan").doc(id).get().then(function(doc){

    var p = doc.data()
      var tanggalHariIni = new Date().toISOString().split("T")[0]

    for(var i=0; i<p.items.length; i++){

      var produk = p.items[i].produk
        var jumlah = p.items[i].jumlah
      var harga = hargaProdukAdmin[produk]
        var modal = modalProduk[produk]
      var pendapatan = harga * jumlah
        var untung = (harga - modal) * jumlah

      db.collection("transaksi").add({
          tanggal: tanggalHariIni,
        produk: produk,
          jumlah: jumlah,
        harga: harga,
          modal: modal,
        pendapatan: pendapatan,
          untung: untung,
        pesananId: id,
          dibuat: firebase.firestore.FieldValue.serverTimestamp()
      })

    }

    db.collection("pesanan").doc(id).update({
        status: "selesai"
    })

  })

}

function hapusPesanan(id){

  var yakin = confirm("yakin mau hapus pesanan ini dari daftar?")

  if(yakin){
      db.collection("pesanan").doc(id).delete()
  }

}

// cek status login tiap kali halaman dibuka
auth.onAuthStateChanged(function(user){

  if(user){
      document.getElementById("loginBox").style.display = "none"
    document.getElementById("appArea").style.display = "block"
      ambilTransaksi()
    ambilPesananMasuk()
  } else {
    document.getElementById("loginBox").style.display = "block"
      document.getElementById("appArea").style.display = "none"
  }

})

function loginAdmin(){

  var email = document.getElementById("loginEmail").value
  var pass = document.getElementById("loginPassword").value

    var errBox = document.getElementById("loginErr")
  errBox.style.display = "none"

  if(email == "" || pass == ""){
      errBox.innerHTML = "email sama password wajib diisi"
    errBox.style.display = "block"
      return
  }

  auth.signInWithEmailAndPassword(email, pass)
    .catch(function(error){
        errBox.innerHTML = "login gagal: " + error.message
      errBox.style.display = "block"
    })

}

function logoutAdmin(){
  auth.signOut()
}

function simpanTransaksi(){

  var tanggal = document.getElementById("fTanggal").value
  var produk = document.getElementById("fProduk").value
    var jumlah = parseInt(document.getElementById("fJumlah").value)
  var harga = parseInt(document.getElementById("fHarga").value)
  var modal = parseInt(document.getElementById("fModal").value)

  var errBox = document.getElementById("formErr")
    errBox.style.display = "none"

  // validasi input dulu sebelum kesimpen ke database
  if(tanggal == ""){
      errBox.innerHTML = "tanggal belum diisi"
    errBox.style.display = "block"
      return
  }

  if(isNaN(jumlah) || jumlah <= 0){
      errBox.innerHTML = "jumlah terjual harus angka lebih dari 0"
    errBox.style.display = "block"
      return
  }

  if(isNaN(harga) || harga < 0 || isNaN(modal) || modal < 0){
      errBox.innerHTML = "harga sama modal harus angka yang bener"
    errBox.style.display = "block"
      return
  }

  var pendapatan = jumlah * harga
  var untung = (harga - modal) * jumlah

  db.collection("transaksi").add({
      tanggal: tanggal,
    produk: produk,
      jumlah: jumlah,
    harga: harga,
      modal: modal,
    pendapatan: pendapatan,
      untung: untung,
    dibuat: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    document.getElementById("fJumlah").value = ""
  })

}

function ambilTransaksi(){

  db.collection("transaksi").orderBy("tanggal", "desc").onSnapshot(function(snapshot){

    semuaTransaksi = []

      snapshot.forEach(function(doc){
      var data = doc.data()
        data.id = doc.id
      semuaTransaksi.push(data)
    })

    tampilkanRekap()

  })

}

function hapusTransaksi(id){

  var yakin = confirm("yakin mau hapus transaksi ini?")

  if(!yakin){
      return
  }

  db.collection("transaksi").doc(id).get().then(function(doc){

    var data = doc.data()
      var pesananIdTerkait = data.pesananId

    db.collection("transaksi").doc(id).delete().then(function(){

      // kalo transaksi ini asalnya dari pesanan pelanggan, cek dulu
        // masih ada transaksi lain dari pesanan yang sama apa engga
      if(pesananIdTerkait){

        db.collection("transaksi").where("pesananId", "==", pesananIdTerkait).get().then(function(snapshot){

            if(snapshot.empty){
            // udah ga ada transaksi lain dari pesanan ini, hapus juga pesanannya
              db.collection("pesanan").doc(pesananIdTerkait).delete()
          }

        })

      }

    })

  })

}

function tampilkanRekap(){

  var totalPendapatan = 0
  var totalModal = 0
    var totalUntung = 0

  var htmlTabel = ""

  var perTanggal = {}
  var perProduk = {}

  for(var i=0; i<semuaTransaksi.length; i++){

    var t = semuaTransaksi[i]

    totalPendapatan = totalPendapatan + t.pendapatan
      totalModal = totalModal + (t.modal * t.jumlah)
    totalUntung = totalUntung + t.untung

    htmlTabel = htmlTabel + "<tr><td>" + t.tanggal + "</td><td>" + t.produk + "</td><td>" + t.jumlah + "</td><td>Rp " + t.pendapatan.toLocaleString("id-ID") + "</td><td>Rp " + t.untung.toLocaleString("id-ID") + "</td><td><button class='hapusbtn' onclick='hapusTransaksi(\"" + t.id + "\")'>hapus</button></td></tr>"

    // buat data grafik tren per tanggal
    if(perTanggal[t.tanggal] == undefined){
        perTanggal[t.tanggal] = 0
    }
    perTanggal[t.tanggal] = perTanggal[t.tanggal] + t.pendapatan

    // buat data grafik produk terlaris
    if(perProduk[t.produk] == undefined){
        perProduk[t.produk] = 0
    }
    perProduk[t.produk] = perProduk[t.produk] + t.jumlah

  }

  document.getElementById("statPendapatan").innerHTML = "Rp " + totalPendapatan.toLocaleString("id-ID")
  document.getElementById("statModal").innerHTML = "Rp " + totalModal.toLocaleString("id-ID")
  document.getElementById("statUntung").innerHTML = "Rp " + totalUntung.toLocaleString("id-ID")

  document.getElementById("cardPendapatan").innerHTML = "Rp " + totalPendapatan.toLocaleString("id-ID")
  document.getElementById("cardModal").innerHTML = "Rp " + totalModal.toLocaleString("id-ID")
  document.getElementById("cardUntung").innerHTML = "Rp " + totalUntung.toLocaleString("id-ID")

  document.getElementById("tabelTransaksi").innerHTML = htmlTabel

  gambarGrafik(perTanggal, perProduk)

}

function gambarGrafik(perTanggal, perProduk){

  // urutin tanggal dari lama ke baru buat grafik tren
  var labelTanggal = Object.keys(perTanggal).sort()
  var dataTanggal = []
    for(var i=0; i<labelTanggal.length; i++){
    dataTanggal.push(perTanggal[labelTanggal[i]])
  }

  var labelProduk = Object.keys(perProduk)
  var dataProduk = []
    for(var j=0; j<labelProduk.length; j++){
    dataProduk.push(perProduk[labelProduk[j]])
  }

  var warnaProduk = ["#7b61ff", "#ff6f91", "#2dd4bf", "#ffb020", "#4dabf7", "#e64980"]

  if(chartTren == null){

    var ctx1 = document.getElementById("grafikTren").getContext("2d")
      chartTren = new Chart(ctx1, {
      type: "line",
        data: {
        labels: labelTanggal,
          datasets: [{
          label: "pendapatan",
            data: dataTanggal,
          borderColor: "#7b61ff",
            backgroundColor: "rgba(123,97,255,0.1)",
          fill: true,
            tension: 0.3
        }]
      },
        options: {
        plugins: { legend: { display: false } }
      }
    })

  } else {
    chartTren.data.labels = labelTanggal
      chartTren.data.datasets[0].data = dataTanggal
    chartTren.update()
  }

  if(chartProduk == null){

    var ctx2 = document.getElementById("grafikProduk").getContext("2d")
      chartProduk = new Chart(ctx2, {
      type: "doughnut",
        data: {
        labels: labelProduk,
          datasets: [{
          data: dataProduk,
            backgroundColor: warnaProduk
        }]
      },
        options: {
        plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } }
      }
    })

  } else {
    chartProduk.data.labels = labelProduk
      chartProduk.data.datasets[0].data = dataProduk
    chartProduk.update()
  }

}

function exportPdf(){

  var docPdf = new jspdf.jsPDF()

  docPdf.setFontSize(14)
    docPdf.text("laporan penjualan popice", 14, 15)

  var rows = []
    for(var i=0; i<semuaTransaksi.length; i++){
    var t = semuaTransaksi[i]
      rows.push([t.tanggal, t.produk, t.jumlah, "Rp " + t.pendapatan.toLocaleString("id-ID"), "Rp " + t.untung.toLocaleString("id-ID")])
  }

  docPdf.autoTable({
      startY: 22,
    head: [["tanggal", "produk", "jumlah", "pendapatan", "untung"]],
      body: rows
  })

  docPdf.save("laporan-popice.pdf")

}

function exportExcel(){

  var dataExcel = []

  for(var i=0; i<semuaTransaksi.length; i++){
      var t = semuaTransaksi[i]
    dataExcel.push({
        tanggal: t.tanggal,
      produk: t.produk,
        jumlah: t.jumlah,
      pendapatan: t.pendapatan,
        untung: t.untung
    })
  }

  var sheet = XLSX.utils.json_to_sheet(dataExcel)
    var buku = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(buku, sheet, "laporan")

  XLSX.writeFile(buku, "laporan-popice.xlsx")

}

